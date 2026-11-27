import type { Database } from "@/lib/supabase/types";
import type { Situacao } from "@/components/ui";
import { competencia, data } from "@/lib/format";

export type Cobranca = Database["public"]["Tables"]["cobrancas"]["Row"];
export type Pagamento = Database["public"]["Tables"]["pagamentos"]["Row"];
export type ItemCobranca = { cobranca: Cobranca; pagamento: Pagamento | null; situacao: Situacao };

/** Nome único de uma cobrança em todo o app: "Mensalidade de novembro de 2026" ou o título do evento. */
export function tituloCobranca(c: Pick<Cobranca, "tipo" | "titulo" | "competencia">) {
  if (c.tipo !== "mensalidade" || !c.competencia) return c.titulo;
  return `Mensalidade de ${competencia(c.competencia).toLowerCase()}`;
}

const DIA = 86_400_000;

/**
 * Texto do prazo, igual em todas as telas. `vencida` só vale para cobranças ainda em aberto.
 * Ex.: "Venceu há 16 dias", "Vence hoje", "Vence amanhã", "Vence em 31/01/2027".
 */
export function prazo(vencimento: string | null, hoje: string, emAberto: boolean): { texto: string; vencida: boolean } | null {
  if (!vencimento) return null;
  const dias = Math.round((Date.parse(`${vencimento}T00:00:00Z`) - Date.parse(`${hoje}T00:00:00Z`)) / DIA);
  if (!emAberto) return { texto: `Vencimento ${data(vencimento)}`, vencida: false };
  if (dias < 0) return { texto: dias === -1 ? "Venceu ontem" : `Venceu há ${-dias} dias`, vencida: true };
  if (dias === 0) return { texto: "Vence hoje", vencida: false };
  if (dias === 1) return { texto: "Vence amanhã", vencida: false };
  return { texto: `Vence em ${data(vencimento)}`, vencida: false };
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

/**
 * Cobranças que valem para o membro, com a situação de cada uma:
 * eventos sempre; mensalidades a partir do mês em que ele se cadastrou.
 */
export function itensDoMembro(cobrancas: Cobranca[], pagamentos: Pagamento[], cadastradoEm: string): ItemCobranca[] {
  const mesEntrada = `${cadastradoEm.slice(0, 7)}-01`;
  const relevantes = cobrancas.filter((c) => c.tipo === "evento" || (c.competencia ?? "") >= mesEntrada);
  return situacaoPorCobranca(relevantes, pagamentos);
}
