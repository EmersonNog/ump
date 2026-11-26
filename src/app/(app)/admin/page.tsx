import type { Metadata } from "next";
import Link from "next/link";
import { CheckCheck, ChevronRight, Inbox } from "lucide-react";
import { Cartao, Selo, Vazio, cx } from "@/components/ui";
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
  const { status } = await searchParams;
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
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <Cartao className="bg-amber-50 dark:bg-amber-950/30">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Aguardando conferência</p>
          <p className="mt-1 font-serif text-3xl font-semibold">{emAnalise ?? 0}</p>
        </Cartao>
        <Cartao className="bg-brand-50 dark:bg-brand-950">
          <p className="text-xs font-medium text-brand-700 dark:text-brand-200">Confirmado este mês</p>
          <p className="mt-1 font-serif text-3xl font-semibold">{moeda(recebidoMes)}</p>
        </Cartao>
      </div>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
        {FILTROS.map((f) => (
          <Link
            key={f.valor}
            href={f.valor === "em_analise" ? "/admin" : `/admin?status=${f.valor}`}
            className={cx(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition",
              filtro === f.valor
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-borda bg-superficie text-suave hover:text-texto",
            )}
          >
            {f.rotulo}
          </Link>
        ))}
      </div>

      {!pagamentos?.length ? (
        filtro === "em_analise" ? (
          <Vazio icone={<CheckCheck className="size-6" />} titulo="Tudo conferido!">
            Nenhum comprovante aguardando análise.
          </Vazio>
        ) : (
          <Vazio icone={<Inbox className="size-6" />} titulo="Nada por aqui" />
        )
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2">
          {pagamentos.map((p) => {
            const divergente = p.cobranca && Number(p.valor) !== Number(p.cobranca.valor);
            return (
              <li key={p.id}>
                <Link
                  href={`/admin/pagamentos/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3.5 shadow-sm transition hover:border-brand-300 active:scale-[0.99]"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
                    {(p.membro?.nome ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.membro?.nome ?? "Membro removido"}</p>
                    <p className="truncate text-sm text-suave">{p.cobranca ? tituloCobranca(p.cobranca) : "—"}</p>
                    <p className="text-xs text-suave">
                      <span className={cx(divergente && "font-semibold text-amber-700 dark:text-amber-300")}>{moeda(p.valor)}</span>
                      {" · "}pago {data(p.data_pagamento)} · enviado {dataHoraCurta(p.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Selo situacao={p.status} className="max-sm:hidden" />
                    <ChevronRight className="size-5 text-suave" aria-hidden />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
