import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Cartao, Selo } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { situacaoPorCobranca, tituloCobranca } from "@/lib/cobrancas";
import { data, moeda } from "@/lib/format";
import { AcoesCobranca } from "./acoes";

export const metadata: Metadata = { title: "Cobrança" };

export default async function PaginaCobranca({ params }: PageProps<"/admin/cobrancas/[id]">) {
  const { id } = await params;
  const { supabase } = await exigirAdmin();

  const [{ data: cobranca }, { data: pagamentos }, { data: membros }] = await Promise.all([
    supabase.from("cobrancas").select("*").eq("id", id).maybeSingle(),
    supabase.from("pagamentos").select("*").eq("cobranca_id", id),
    supabase.from("profiles").select("id, nome, ativo, created_at").order("nome"),
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
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/admin/cobrancas" className="inline-flex items-center gap-1 text-sm text-suave hover:text-texto">
        <ArrowLeft className="size-4" aria-hidden /> Cobranças
      </Link>

      <Cartao>
        <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-300">
          {cobranca.tipo === "evento" ? "Evento" : "Mensalidade"} {!cobranca.ativa && "· encerrada"}
        </p>
        <h1 className="mt-0.5 font-serif text-2xl font-semibold">{tituloCobranca(cobranca)}</h1>
        {cobranca.descricao && <p className="mt-1 text-sm text-suave">{cobranca.descricao}</p>}
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-suave">Valor</p>
            <p className="font-semibold">{moeda(cobranca.valor)}</p>
          </div>
          <div>
            <p className="text-suave">Pagos</p>
            <p className="font-semibold">
              {pagos.length}/{linhas.length}
            </p>
          </div>
          <div>
            <p className="text-suave">Arrecadado</p>
            <p className="font-semibold">{moeda(arrecadado)}</p>
          </div>
        </div>
        {cobranca.vencimento && <p className="mt-3 text-xs text-suave">Vencimento: {data(cobranca.vencimento)}</p>}
        <div className="mt-4 border-t border-borda pt-4">
          <AcoesCobranca id={cobranca.id} ativa={cobranca.ativa} />
        </div>
      </Cartao>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold">Situação dos membros</h2>
        <ul className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda bg-superficie">
          {linhas.map(({ membro, pagamento, situacao }) => {
            const conteudo = (
              <>
                <span className="min-w-0 flex-1 truncate font-medium">{membro.nome}</span>
                {pagamento && situacao !== "pendente" && (
                  <span className="text-xs text-suave">{moeda(pagamento.valor)}</span>
                )}
                <Selo situacao={situacao} />
              </>
            );
            return (
              <li key={membro.id}>
                {pagamento ? (
                  <Link href={`/admin/pagamentos/${pagamento.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-fundo">
                    {conteudo}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3">{conteudo}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
