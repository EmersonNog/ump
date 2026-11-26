import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * Chamado 1x por dia pelo Vercel Cron (vercel.json).
 * Faz uma consulta real ao banco para o Supabase Free não pausar o projeto por inatividade.
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const { error } = await createServiceClient().from("configuracoes").select("id").limit(1);
  if (error) {
    console.error("[manter-ativo] falha ao consultar o banco", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, em: new Date().toISOString() });
}
