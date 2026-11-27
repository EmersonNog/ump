import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Aviso, Selo, Vazio, cx } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { data, dataHoraCurta, hojeISO, moeda, primeiroDiaDoMes } from "@/lib/format";

export const metadata: Metadata = { title: "Comprovantes" };

const FILTROS = [
  { valor: "em_analise", rotulo: "Em análise" },
  { valor: "pago", rotulo: "Pagos" },
  { valor: "nao_pago", rotulo: "Não pagos" },
  { valor: "todos", rotulo: "Todos" },
] as const;

type Filtro = (typeof FILTROS)[number]["valor"];
const ehFiltro = (valor: unknown): valor is Filtro => FILTROS.some((f) => f.valor === valor);

export default async function PaginaAdmin({ searchParams }: PageProps<"/admin">) {
  const { status, feito } = await searchParams;
  const filtro: Filtro = ehFiltro(status) ? status : "em_analise";
  const { supabase } = await exigirAdmin();

  let consulta = supabase
    .from("pagamentos")
    .select("id, valor, data_pagamento, status, created_at, membro:profiles!pagamentos_membro_id_fkey(nome), cobranca:cobrancas(tipo, titulo, competencia, valor)")
    .order("created_at", { ascending: filtro === "em_analise" })
    .limit(200);
  if (filtro !== "todos") consulta = consulta.eq("status", filtro);

  const inicioMes = primeiroDiaDoMes(hojeISO());
  const [{ data: pagamentos }, { count: emAnalise }, { data: pagosMes }] = await Promise.all([
    consulta,
    supabase.from("pagamentos").select("id", { count: "exact", head: true }).eq("status", "em_analise"),
    supabase.from("pagamentos").select("valor").eq("status", "pago").gte("data_pagamento", inicioMes),
  ]);
  const recebidoMes = (pagosMes ?? []).reduce((s, p) => s + Number(p.valor), 0);

  return (
    <div className="space-y-8">
      {(feito === "pago" || feito === "nao_pago") && (
        <Aviso tipo="sucesso">
          {feito === "pago" ? "Pagamento confirmado." : "Marcado como não pago."} Não há mais comprovantes em análise.
        </Aviso>
      )}
      <dl className="flex flex-wrap gap-x-12 gap-y-4">
        <div>
          <dt className="text-sm text-suave">Aguardando conferência</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{emAnalise ?? 0}</dd>
        </div>
        <div>
          <dt className="text-sm text-suave">Confirmado este mês</dt>
          <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{moeda(recebidoMes)}</dd>
        </div>
      </dl>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borda pb-3">
          <nav aria-label="Filtrar por situação" className="max-w-full overflow-x-auto [scrollbar-width:none]">
            <ul className="inline-flex gap-1 rounded-xl border border-borda bg-fundo p-1">
              {FILTROS.map((f) => (
                <li key={f.valor}>
                  <Link
                    href={f.valor === "em_analise" ? "/admin" : `/admin?status=${f.valor}`}
                    aria-current={filtro === f.valor ? "page" : undefined}
                    className={cx(
                      "inline-flex h-8 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition",
                      filtro === f.valor
                        ? "bg-superficie text-texto shadow-sm ring-1 ring-borda"
                        : "text-suave hover:text-texto",
                    )}
                  >
                    {f.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {!!pagamentos?.length && (
            <span className="text-sm text-suave tabular-nums">
              {pagamentos.length} {pagamentos.length === 1 ? "comprovante" : "comprovantes"}
            </span>
          )}
        </div>

        {!pagamentos?.length ? (
          filtro === "em_analise" ? (
            <Vazio titulo="Tudo conferido!">Nenhum comprovante aguardando análise.</Vazio>
          ) : (
            <Vazio titulo="Nada por aqui">Nenhum comprovante nesta situação. Escolha outro filtro.</Vazio>
          )
        ) : (
          <ul className="divide-y divide-borda">
            {pagamentos.map((p) => {
              const divergente = p.cobranca && Number(p.valor) !== Number(p.cobranca.valor);
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/pagamentos/${p.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-4 transition hover:bg-superficie sm:gap-4"
                  >
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-full border border-borda bg-superficie text-sm font-medium text-suave"
                    >
                      {(p.membro?.nome ?? "?").charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.membro?.nome ?? "Membro removido"}</p>
                      <p className="truncate text-sm text-suave">{p.cobranca ? tituloCobranca(p.cobranca) : "—"}</p>
                      <p className="truncate text-xs text-suave">
                        Pago {data(p.data_pagamento)} · enviado {dataHoraCurta(p.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span
                        className={cx(
                          "inline-flex items-center gap-1 font-medium tabular-nums",
                          divergente && "text-amber-700 dark:text-amber-300",
                        )}
                        title={divergente ? "Valor diferente do cobrado" : undefined}
                      >
                        {divergente && <AlertTriangle className="size-3.5" aria-hidden />}
                        {moeda(p.valor)}
                        {divergente && <span className="sr-only"> (valor diferente do cobrado)</span>}
                      </span>
                      <Selo situacao={p.status} />
                    </div>
                    <ChevronRight className="-mr-1 size-4 shrink-0 text-suave" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
