import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import { cx } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { situacaoPorCobranca } from "@/lib/cobrancas";
import { data, hojeISO, moeda, primeiroDiaDoMes } from "@/lib/format";
import { AcoesMembro } from "./acoes";

export const metadata: Metadata = { title: "Membros" };

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberto", rotulo: "Em aberto" },
  { valor: "em-dia", rotulo: "Em dia" },
  { valor: "inativos", rotulo: "Inativos" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];
const ehFiltro = (valor: unknown): valor is Filtro => FILTROS.some((f) => f.valor === valor);

export default async function PaginaMembros({ searchParams }: PageProps<"/admin/membros">) {
  const { filtro: filtroParam } = await searchParams;
  const filtro: Filtro = ehFiltro(filtroParam) ? filtroParam : "todos";
  const { supabase, perfil } = await exigirAdmin();

  const [{ data: membros }, { data: pagamentos }, { data: cobrancas }] = await Promise.all([
    supabase.from("profiles").select("*").order("nome"),
    supabase.from("pagamentos").select("*"),
    supabase.from("cobrancas").select("*").eq("ativa", true),
  ]);

  const mesAtual = primeiroDiaDoMes(hojeISO());
  const linhas = (membros ?? []).map((m) => {
    const meus = (pagamentos ?? []).filter((p) => p.membro_id === m.id);
    const mesEntrada = primeiroDiaDoMes(m.created_at.slice(0, 10));
    // Mensalidades vencidas ou do mês atual, desde que o membro entrou (mesma regra da tela do membro).
    const mensalidades = (cobrancas ?? []).filter(
      (c) => c.tipo === "mensalidade" && (c.competencia ?? "") >= mesEntrada && (c.competencia ?? "") <= mesAtual,
    );
    const itens = situacaoPorCobranca(mensalidades, meus);
    const abertas = itens.filter((i) => i.situacao === "pendente" || i.situacao === "nao_pago");
    const pagos = meus.filter((p) => p.status === "pago");
    const ultimo = pagos.reduce<string | null>((max, p) => (!max || p.data_pagamento > max ? p.data_pagamento : max), null);

    return {
      membro: m,
      abertas: abertas.length,
      valorAberto: abertas.reduce((s, i) => s + Number(i.cobranca.valor), 0),
      emAnalise: meus.filter((p) => p.status === "em_analise").length,
      eventosPagos: new Set(
        pagos.filter((p) => cobrancas?.find((c) => c.id === p.cobranca_id)?.tipo === "evento").map((p) => p.cobranca_id),
      ).size,
      totalPago: pagos.reduce((s, p) => s + Number(p.valor), 0),
      ultimo,
    };
  });

  const ativos = linhas.filter((l) => l.membro.ativo);
  const contagem: Record<Filtro, number> = {
    todos: ativos.length,
    aberto: ativos.filter((l) => l.abertas > 0).length,
    "em-dia": ativos.filter((l) => l.abertas === 0).length,
    inativos: linhas.length - ativos.length,
  };
  const visiveis =
    filtro === "inativos"
      ? linhas.filter((l) => !l.membro.ativo)
      : ativos.filter((l) => filtro === "todos" || (filtro === "aberto" ? l.abertas > 0 : l.abertas === 0));
  const totalAberto = ativos.reduce((s, l) => s + l.valorAberto, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-suave">
          {ativos.length} membro(s) ativo(s) · {contagem.aberto} com mensalidade em aberto ·{" "}
          <span className="font-semibold text-texto">{moeda(totalAberto)}</span> a receber
        </p>
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={f.valor === "todos" ? "/admin/membros" : `/admin/membros?filtro=${f.valor}`}
              className={cx(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition",
                filtro === f.valor
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-borda bg-superficie text-suave hover:text-texto",
              )}
            >
              {f.rotulo} <span className="opacity-70">({contagem[f.valor]})</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-borda bg-superficie shadow-sm">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-fundo text-left text-xs tracking-wide whitespace-nowrap text-suave uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Membro</th>
              <th className="px-4 py-3 font-semibold">Mensalidades</th>
              <th className="px-4 py-3 font-semibold">Em análise</th>
              <th className="px-4 py-3 font-semibold">Eventos pagos</th>
              <th className="px-4 py-3 text-right font-semibold">Total pago</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-suave">
                  Nenhum membro neste filtro.
                </td>
              </tr>
            )}
            {visiveis.map(({ membro: m, abertas, valorAberto, emAnalise, eventosPagos, totalPago, ultimo }) => (
              <tr key={m.id} className={cx("align-middle", !m.ativo && "opacity-60")}>
                <td className="px-4 py-3">
                  <p className="font-semibold whitespace-nowrap">
                    {m.nome}
                    {m.papel === "admin" && (
                      <span className="ml-2 rounded-full bg-ouro-300/40 px-2 py-0.5 text-[10px] font-bold text-ouro-600 uppercase dark:text-ouro-300">
                        Admin
                      </span>
                    )}
                    {!m.ativo && <span className="ml-2 text-xs font-normal text-suave">(inativo)</span>}
                  </p>
                  <p className="text-xs text-suave">{m.email}</p>
                  <p className="text-xs text-suave">
                    {m.telefone ? `${m.telefone} · ` : ""}desde {data(m.created_at.slice(0, 10))}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {abertas === 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-brand-800 dark:bg-brand-900 dark:text-brand-100">
                      <CheckCircle2 className="size-3.5" aria-hidden /> Em dia
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-red-800 dark:bg-red-950 dark:text-red-200">
                      <CircleAlert className="size-3.5" aria-hidden />
                      {abertas} em aberto · {moeda(valorAberto)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {emAnalise > 0 ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                    >
                      <Clock3 className="size-3.5" aria-hidden /> {emAnalise}
                    </Link>
                  ) : (
                    <span className="text-suave">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-suave">{eventosPagos || "—"}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <p className="font-medium">{moeda(totalPago)}</p>
                  {ultimo && <p className="text-xs text-suave">último em {data(ultimo)}</p>}
                </td>
                <td className="px-4 py-3">
                  <AcoesMembro id={m.id} papel={m.papel} ativo={m.ativo} euMesmo={m.id === perfil.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-suave">
        “Mensalidades” considera as mensalidades até o mês atual, a partir do mês em que o membro se cadastrou. Novos membros
        se cadastram pelo próprio app.
      </p>
    </div>
  );
}
