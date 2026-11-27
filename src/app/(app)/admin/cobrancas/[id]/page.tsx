import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { CabecalhoSecao, Selo } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { situacaoPorCobranca, tituloCobranca } from "@/lib/cobrancas";
import { data, moeda } from "@/lib/format";
import { AcoesCobranca } from "./acoes";

export const metadata: Metadata = { title: "Cobrança" };

/** Número no formato do wa.me (com DDI 55 quando faltar). */
const whatsapp = (telefone: string) => {
  const n = telefone.replace(/\D/g, "");
  return n.length <= 11 ? `55${n}` : n;
};

export default async function PaginaCobranca({ params }: PageProps<"/admin/cobrancas/[id]">) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();

  const [{ data: cobranca }, { data: pagamentos }, { data: membros }] = await Promise.all([
    supabase.from("cobrancas").select("*").eq("id", id).maybeSingle(),
    supabase.from("pagamentos").select("*").eq("cobranca_id", id),
    supabase.from("profiles").select("id, nome, ativo, created_at, telefone").order("nome"),
  ]);
  if (!cobranca) notFound();

  // Ativos (mensalidade: só quem já era membro no mês) + quem já enviou algo.
  const comEnvio = new Set((pagamentos ?? []).map((p) => p.membro_id));
  const linhas = (membros ?? [])
    .filter(
      (m) =>
        comEnvio.has(m.id) ||
        (m.ativo &&
          (cobranca.tipo === "evento" || m.created_at.slice(0, 7) <= (cobranca.competencia ?? "").slice(0, 7))),
    )
    .map((m) => {
      const [item] = situacaoPorCobranca([cobranca], (pagamentos ?? []).filter((p) => p.membro_id === m.id));
      return { membro: m, ...item };
    });

  const ordem = { em_analise: 0, nao_pago: 1, pendente: 2, pago: 3 } as const;
  linhas.sort((a, b) => ordem[a.situacao] - ordem[b.situacao] || a.membro.nome.localeCompare(b.membro.nome));

  const pagos = linhas.filter((l) => l.situacao === "pago");
  const arrecadado = pagos.reduce((s, l) => s + Number(l.pagamento?.valor ?? 0), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-4">
        <Link href="/admin/cobrancas" className="inline-flex items-center gap-1 text-sm text-suave transition hover:text-texto">
          <ArrowLeft className="size-4" aria-hidden /> Cobranças
        </Link>

        <div>
          <p className="text-sm text-suave">
            {cobranca.tipo === "evento" ? "Evento" : "Mensalidade"}
            {!cobranca.ativa && " · Encerrada"}
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-balance break-words">{tituloCobranca(cobranca)}</h1>
          {cobranca.descricao && <p className="mt-2 text-sm whitespace-pre-line text-suave">{cobranca.descricao}</p>}
        </div>

        <p className="flex flex-wrap gap-x-2 gap-y-1 text-sm text-suave">
          <span className="font-medium text-texto tabular-nums">{moeda(cobranca.valor)}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            Pagos{" "}
            <span className="font-medium text-texto">
              {pagos.length}/{linhas.length}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            Arrecadado <span className="font-medium text-texto">{moeda(arrecadado)}</span>
          </span>
          {cobranca.vencimento && (
            <>
              <span aria-hidden>·</span>
              <span className="tabular-nums">Vence em {data(cobranca.vencimento)}</span>
            </>
          )}
        </p>

        <AcoesCobranca id={cobranca.id} ativa={cobranca.ativa} />
      </div>

      <section>
        <CabecalhoSecao titulo="Situação dos membros" detalhe={linhas.length} />
        <ul className="divide-y divide-borda">
          {linhas.map(({ membro, pagamento, situacao }) => {
            const conteudo = (
              <>
                <span className="min-w-0 flex-1 truncate font-medium">{membro.nome}</span>
                {pagamento && situacao !== "pendente" && (
                  <span className="text-sm text-suave tabular-nums">{moeda(pagamento.valor)}</span>
                )}
                <Selo situacao={situacao} />
              </>
            );
            return (
              <li key={membro.id}>
                {pagamento ? (
                  <Link
                    href={`/admin/pagamentos/${pagamento.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-4 transition hover:bg-superficie"
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 py-4">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{membro.nome}</span>
                      {membro.telefone && (
                        <a
                          href={`https://wa.me/${whatsapp(membro.telefone)}?text=${encodeURIComponent(
                            `Oi, ${membro.nome.split(" ")[0]}! Aqui é da diretoria da UMP Jóquei. Consta em aberto: ${tituloCobranca(cobranca).toLowerCase()} (${moeda(cobranca.valor)}). Dá para pagar e enviar o comprovante pelo app. Obrigado!`,
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-azul-700 underline-offset-4 hover:underline dark:text-azul-300"
                        >
                          <MessageCircle className="size-3.5" aria-hidden /> Lembrar no WhatsApp
                        </a>
                      )}
                    </span>
                    <Selo situacao={situacao} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
