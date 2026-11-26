import type { Database } from "@/lib/supabase/types";
import type { Situacao } from "@/components/ui";
import { competencia } from "@/lib/format";

export type Cobranca = Database["public"]["Tables"]["cobrancas"]["Row"];
export type Pagamento = Database["public"]["Tables"]["pagamentos"]["Row"];
export type ItemCobranca = { cobranca: Cobranca; pagamento: Pagamento | null; situacao: Situacao };

export function tituloCobranca(c: Pick<Cobranca, "tipo" | "titulo" | "competencia">) {
  return c.tipo === "mensalidade" && c.competencia ? `Mensalidade · ${competencia(c.competencia)}` : c.titulo;
}

/** Situação do membro em cada cobrança, considerando o envio mais recente. */
export function situacaoPorCobranca(cobrancas: Cobranca[], pagamentos: Pagamento[]): ItemCobranca[] {
  const ultimo = new Map<string, Pagamento>();
  for (const p of pagamentos) {
    const atual = ultimo.get(p.cobranca_id);
    // Um envio pago ou em análise prevalece sobre recusas antigas.
    const prioridade = (x: Pagamento) => (x.status === "nao_pago" ? 0 : 1);
    if (
      !atual ||
      prioridade(p) > prioridade(atual) ||
      (prioridade(p) === prioridade(atual) && p.created_at > atual.created_at)
    ) {
      ultimo.set(p.cobranca_id, p);
    }
  }

  return cobrancas.map((cobranca) => {
    const pagamento = ultimo.get(cobranca.id) ?? null;
    const situacao: Situacao = pagamento ? pagamento.status : "pendente";
    return { cobranca, pagamento, situacao };
  });
}
