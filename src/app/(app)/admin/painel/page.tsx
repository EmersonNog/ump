import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/auth";
import { Painel, type Lancamento } from "./painel";

export const metadata: Metadata = { title: "Painel financeiro" };

export default async function PaginaPainel() {
  const { supabase } = await exigirAdmin();
  const [{ data: lancamentos }, { data: socios }] = await Promise.all([
    supabase
      .from("lancamentos")
      .select("id, data, detalhes, valor, categoria, forma, origem, socio_id, pagamento_id")
      .order("data")
      .order("created_at"),
    supabase.from("socios").select("id, nome").order("id"),
  ]);

  const lista: Lancamento[] = (lancamentos ?? []).map((l, i) => ({
    id: l.id,
    ordem: i,
    data: l.data,
    detalhes: l.detalhes,
    valor: Number(l.valor),
    categoria: l.categoria,
    forma: l.forma,
    origem: l.origem,
    socio: l.socio_id,
    doApp: !!l.pagamento_id,
  }));

  return <Painel lancamentos={lista} socios={Object.fromEntries((socios ?? []).map((s) => [s.id, s.nome]))} />;
}
