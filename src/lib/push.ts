import "server-only";
import { sendNotification, setVapidDetails, WebPushError } from "web-push";
import { createServiceClient } from "@/lib/supabase/server";

export type Notificacao = { title: string; body: string; url: string; tag?: string };

export const pushConfigurado = Boolean(
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_SECRET_KEY,
);

if (pushConfigurado) {
  setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:ump@exemplo.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

type Destino = { usuarios: string[] } | { papel: "admin" | "todos" };

/**
 * Envia Web Push (gratuito) para os dispositivos inscritos.
 * Falhas nunca interrompem a ação que originou a notificação.
 */
export async function notificar(destino: Destino, notificacao: Notificacao) {
  if (!pushConfigurado) return;

  try {
    const db = createServiceClient();
    let usuarios: string[] | null = null;

    if ("usuarios" in destino) {
      usuarios = destino.usuarios;
    } else if (destino.papel === "admin") {
      const { data } = await db.from("profiles").select("id").eq("papel", "admin");
      usuarios = (data ?? []).map((p) => p.id);
    } else {
      const { data } = await db.from("profiles").select("id").eq("ativo", true);
      usuarios = (data ?? []).map((p) => p.id);
    }
    if (usuarios.length === 0) return;

    const { data: inscricoes } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", usuarios);
    if (!inscricoes?.length) return;

    const payload = JSON.stringify(notificacao);
    const expiradas: string[] = [];

    await Promise.all(
      inscricoes.map(async (s) => {
        try {
          await sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 60 * 60 * 24 },
          );
        } catch (erro) {
          const status = erro instanceof WebPushError ? erro.statusCode : undefined;
          if (status === 404 || status === 410) expiradas.push(s.id);
          else console.error("[push] falha ao enviar", status, erro);
        }
      }),
    );

    if (expiradas.length) await db.from("push_subscriptions").delete().in("id", expiradas);
  } catch (erro) {
    console.error("[push] erro inesperado", erro);
  }
}
