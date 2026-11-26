import type { Metadata } from "next";
import { Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { data } from "@/lib/format";
import { AcoesMembro } from "./acoes";

export const metadata: Metadata = { title: "Membros" };

export default async function PaginaMembros() {
  const { supabase, perfil } = await exigirAdmin();

  const [{ data: membros }, { data: pagos }] = await Promise.all([
    supabase.from("profiles").select("*").order("ativo", { ascending: false }).order("nome"),
    supabase.from("pagamentos").select("membro_id").eq("status", "pago"),
  ]);

  const pagosPorMembro = new Map<string, number>();
  for (const p of pagos ?? []) pagosPorMembro.set(p.membro_id, (pagosPorMembro.get(p.membro_id) ?? 0) + 1);

  const ativos = (membros ?? []).filter((m) => m.ativo).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-suave">
        {ativos} membro(s) ativo(s). Novos membros se cadastram pelo próprio app; aqui você define administradores e
        desativa quem saiu da mocidade.
      </p>
      <ul className="grid gap-2.5 md:grid-cols-2">
        {(membros ?? []).map((m) => (
          <li key={m.id}>
            <Cartao className={m.ativo ? "" : "opacity-60"}>
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                  {m.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {m.nome}
                    {m.papel === "admin" && (
                      <span className="ml-2 rounded-full bg-ouro-300/40 px-2 py-0.5 text-[10px] font-bold text-ouro-600 uppercase dark:text-ouro-300">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-suave">{m.email}</p>
                  <p className="text-xs text-suave">
                    {m.telefone ? `${m.telefone} · ` : ""}desde {data(m.created_at.slice(0, 10))} · {pagosPorMembro.get(m.id) ?? 0} pagamento(s)
                  </p>
                </div>
              </div>
              <AcoesMembro id={m.id} papel={m.papel} ativo={m.ativo} euMesmo={m.id === perfil.id} />
            </Cartao>
          </li>
        ))}
      </ul>
    </div>
  );
}
