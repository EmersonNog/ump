import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { cx } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { situacaoPorCobranca } from "@/lib/cobrancas";
import { data, hojeISO, moeda, primeiroDiaDoMes } from "@/lib/format";
import { AcoesMembro, MenuMembro } from "./acoes";
import { numeroWhatsApp } from "@/lib/telefone";

export const metadata: Metadata = { title: "Membros" };

const FILTROS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "aberto", rotulo: "Em aberto" },
  { valor: "em-dia", rotulo: "Em dia" },
  { valor: "inativos", rotulo: "Inativos" },
] as const;
type Filtro = (typeof FILTROS)[number]["valor"];
const ehFiltro = (valor: unknown): valor is Filtro => FILTROS.some((f) => f.valor === valor);

const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Iniciais do nome (primeiro e último), para o avatar da lista do celular. */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

/** Link de WhatsApp com a cobrança já escrita, para a diretoria não precisar redigir. */
function linkCobranca(telefone: string | null, nome: string, meses: string[], valor: number) {
  if (!telefone) return null;
  const texto = `Oi, ${nome.split(" ")[0]}! Aqui é da diretoria da UMP Jóquei. Consta em aberto: mensalidade de ${meses.join(", ")} (${moeda(valor)}). Dá para pagar e enviar o comprovante pelo app. Obrigado!`;
  return `https://wa.me/${numeroWhatsApp(telefone)}?text=${encodeURIComponent(texto)}`;
}

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
    const abertas = situacaoPorCobranca(mensalidades, meus).filter((i) => i.situacao === "pendente" || i.situacao === "nao_pago");
    const pagos = meus.filter((p) => p.status === "pago");
    const valorAberto = abertas.reduce((s, i) => s + Number(i.cobranca.valor), 0);
    const meses = abertas.map((i) =>
      i.cobranca.competencia ? mesCurto.format(new Date(`${i.cobranca.competencia}T00:00:00Z`)).replace(".", "") : "?",
    );

    return {
      membro: m,
      abertas: abertas.length,
      meses,
      valorAberto,
      whatsapp: abertas.length > 0 ? linkCobranca(m.telefone, m.nome, meses, valorAberto) : null,
      emAnalise: meus.filter((p) => p.status === "em_analise").length,
      eventosPagos: new Set(
        pagos.filter((p) => cobrancas?.find((c) => c.id === p.cobranca_id)?.tipo === "evento").map((p) => p.cobranca_id),
      ).size,
      totalPago: pagos.reduce((s, p) => s + Number(p.valor), 0),
      ultimo: pagos.reduce<string | null>((max, p) => (!max || p.data_pagamento > max ? p.data_pagamento : max), null),
    };
  });
  type Linha = (typeof linhas)[number];

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

  const situacao = (l: Linha) =>
    l.abertas === 0 ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
        <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
        Em dia
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-laranja-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-laranja-800 tabular-nums dark:bg-laranja-950/60 dark:text-laranja-200">
        <span className="size-1.5 rounded-full bg-laranja-500" aria-hidden />
        {l.meses.join(", ")} · {moeda(l.valorAberto)}
      </span>
    );

  const cobrar = (l: Linha) =>
    l.whatsapp && (
      <a
        href={l.whatsapp}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-azul-700 underline-offset-4 hover:underline dark:text-azul-300"
      >
        <MessageCircle className="size-3.5" aria-hidden /> Lembrar no WhatsApp
      </a>
    );

  return (
    <div className="space-y-6">
      {/* Celular: resumo em números e filtros que cabem na largura, sem rolagem. */}
      <div className="space-y-4 md:hidden">
        <dl className="grid grid-cols-3 divide-x divide-borda rounded-2xl border border-borda bg-superficie py-3">
          <div className="px-3">
            <dt className="text-xs text-suave">Ativos</dt>
            <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{ativos.length}</dd>
          </div>
          <div className="px-3">
            <dt className="text-xs text-suave">Em aberto</dt>
            <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{contagem.aberto}</dd>
          </div>
          <div className="px-3">
            <dt className="text-xs text-suave">A receber</dt>
            <dd className="mt-0.5 font-display text-xl font-bold whitespace-nowrap tabular-nums">{moeda(totalAberto)}</dd>
          </div>
        </dl>
        <nav aria-label="Filtrar membros" className="grid grid-cols-4 gap-1 rounded-xl border border-borda bg-fundo p-1">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={f.valor === "todos" ? "/admin/membros" : `/admin/membros?filtro=${f.valor}`}
              aria-current={filtro === f.valor ? "page" : undefined}
              className={cx(
                "flex flex-col items-center rounded-lg py-1.5 text-xs whitespace-nowrap transition",
                filtro === f.valor ? "bg-superficie font-semibold text-texto shadow-sm ring-1 ring-borda" : "text-suave",
              )}
            >
              {f.rotulo}
              <span className="text-[11px] font-normal text-suave tabular-nums">{contagem[f.valor]}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="hidden flex-wrap items-center justify-between gap-3 md:flex">
        <p className="text-sm text-suave">
          {plural(ativos.length, "membro ativo", "membros ativos")} · {contagem.aberto} com mensalidade em aberto ·{" "}
          <span className="font-semibold text-texto tabular-nums">{moeda(totalAberto)}</span> a receber
        </p>
        <nav aria-label="Filtrar membros" className="inline-flex rounded-xl border border-borda bg-fundo p-1">
          {FILTROS.map((f) => (
            <Link
              key={f.valor}
              href={f.valor === "todos" ? "/admin/membros" : `/admin/membros?filtro=${f.valor}`}
              aria-current={filtro === f.valor ? "page" : undefined}
              className={cx(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm whitespace-nowrap transition",
                filtro === f.valor
                  ? "bg-superficie font-medium text-texto shadow-sm ring-1 ring-borda"
                  : "text-suave hover:text-texto",
              )}
            >
              {f.rotulo} <span className="text-suave tabular-nums">{contagem[f.valor]}</span>
            </Link>
          ))}
        </nav>
      </div>

      {visiveis.length === 0 && <p className="py-10 text-center text-sm text-suave">Nenhum membro neste filtro.</p>}

      {/* Celular: um cartão por membro, com a situação em destaque e as ações de administração num menu. */}
      {visiveis.length > 0 && (
        <ul className="space-y-3 md:hidden">
          {visiveis.map((l) => (
            <li
              key={l.membro.id}
              className={cx("rounded-2xl border border-borda bg-superficie p-4", !l.membro.ativo && "opacity-70")}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={cx(
                    "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold",
                    l.abertas > 0
                      ? "bg-laranja-50 text-laranja-800 dark:bg-laranja-950/60 dark:text-laranja-200"
                      : "bg-azul-50 text-azul-800 dark:bg-azul-950/70 dark:text-azul-200",
                  )}
                >
                  {iniciais(l.membro.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5">
                    <span className="truncate font-semibold">{l.membro.nome}</span>
                    {l.membro.papel === "admin" && (
                      <span className="shrink-0 rounded-md bg-fundo px-1.5 py-px text-[11px] font-medium text-suave">Admin</span>
                    )}
                    {!l.membro.ativo && (
                      <span className="shrink-0 rounded-md bg-fundo px-1.5 py-px text-[11px] font-medium text-suave">Inativo</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-suave">
                    Desde {mesAno.format(new Date(`${l.membro.created_at.slice(0, 10)}T00:00:00Z`)).replace(". de", "")}
                    {l.membro.telefone ? ` · ${l.membro.telefone}` : ""}
                  </p>
                </div>
                <MenuMembro rotulo={`Mais ações para ${l.membro.nome}`}>
                  <AcoesMembro
                    id={l.membro.id}
                    papel={l.membro.papel}
                    ativo={l.membro.ativo}
                    euMesmo={l.membro.id === perfil.id}
                    empilhado
                  />
                </MenuMembro>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-borda">
                <div className="bg-fundo px-3 py-2.5">
                  <dt className="text-xs text-suave">{l.abertas > 0 ? "Em aberto" : "Mensalidades"}</dt>
                  {l.abertas > 0 ? (
                    <dd>
                      <p className="font-semibold text-laranja-800 tabular-nums dark:text-laranja-300">
                        {moeda(l.valorAberto)}
                      </p>
                      <p className="text-xs text-suave capitalize">{l.meses.join(", ")}</p>
                    </dd>
                  ) : (
                    <dd className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                      Em dia
                    </dd>
                  )}
                </div>
                <div className="bg-fundo px-3 py-2.5">
                  <dt className="text-xs text-suave">Total pago</dt>
                  <dd>
                    <p className="font-semibold tabular-nums">{moeda(l.totalPago)}</p>
                    <p className="text-xs text-suave tabular-nums">{l.ultimo ? `último em ${data(l.ultimo)}` : "nenhum ainda"}</p>
                  </dd>
                </div>
              </dl>

              {(l.emAnalise > 0 || l.whatsapp) && (
                <div className="mt-3 flex flex-col gap-2">
                  {l.emAnalise > 0 && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-between rounded-xl bg-azul-50 px-3 py-2.5 text-sm font-medium text-azul-800 transition hover:bg-azul-100 dark:bg-azul-950/70 dark:text-azul-200 dark:hover:bg-azul-900"
                    >
                      {plural(l.emAnalise, "comprovante para conferir", "comprovantes para conferir")}
                      <ChevronRight className="size-4" aria-hidden />
                    </Link>
                  )}
                  {l.whatsapp && (
                    <a
                      href={l.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-10 items-center justify-center gap-2 rounded-xl border border-borda text-sm font-semibold text-azul-700 transition hover:bg-fundo dark:text-azul-300"
                    >
                      <MessageCircle className="size-4" aria-hidden /> Lembrar no WhatsApp
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Computador: tabela. */}
      {visiveis.length > 0 && (
        <table className="hidden w-full text-sm md:table">
          <thead className="border-b border-borda text-left text-xs whitespace-nowrap text-suave">
            <tr>
              <th className="py-3 pr-4 font-medium">Membro</th>
              <th className="py-3 pr-4 font-medium">Mensalidades em aberto</th>
              <th className="py-3 pr-4 font-medium">Em análise</th>
              <th className="py-3 pr-4 font-medium">Eventos pagos</th>
              <th className="py-3 pr-4 text-right font-medium">Total pago</th>
              <th className="py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {visiveis.map((l) => (
              <tr key={l.membro.id} className={cx("align-middle", !l.membro.ativo && "opacity-60")}>
                <td className="py-4 pr-4">
                  <p className="flex items-center gap-2 font-medium whitespace-nowrap">
                    {l.membro.nome}
                    {l.membro.papel === "admin" && (
                      <span className="rounded-md border border-borda px-1.5 py-px text-xs font-normal text-suave">Admin</span>
                    )}
                    {!l.membro.ativo && <span className="text-xs font-normal text-suave">Inativo</span>}
                  </p>
                  <p className="text-xs text-suave">{l.membro.email}</p>
                  <p className="text-xs text-suave tabular-nums">
                    {l.membro.telefone ? `${l.membro.telefone} · ` : ""}desde {data(l.membro.created_at.slice(0, 10))}
                  </p>
                </td>
                <td className="space-y-1.5 py-4 pr-4">
                  <div>{situacao(l)}</div>
                  {cobrar(l)}
                </td>
                <td className="py-4 pr-4">
                  {l.emAnalise > 0 ? (
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 rounded-full bg-azul-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-azul-800 tabular-nums transition hover:bg-azul-100 dark:bg-azul-950/70 dark:text-azul-200 dark:hover:bg-azul-900"
                    >
                      <span className="size-1.5 rounded-full bg-azul-500" aria-hidden />
                      {l.emAnalise}
                    </Link>
                  ) : (
                    <span className="text-suave">—</span>
                  )}
                </td>
                <td className="py-4 pr-4 text-suave tabular-nums">{l.eventosPagos || "—"}</td>
                <td className="py-4 pr-4 text-right whitespace-nowrap">
                  <p className="font-medium tabular-nums">{moeda(l.totalPago)}</p>
                  {l.ultimo && <p className="text-xs text-suave tabular-nums">último em {data(l.ultimo)}</p>}
                </td>
                <td className="py-4">
                  <AcoesMembro id={l.membro.id} papel={l.membro.papel} ativo={l.membro.ativo} euMesmo={l.membro.id === perfil.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="text-xs text-suave">
        Conta as mensalidades até o mês atual, a partir do mês em que cada membro se cadastrou. Novos membros se cadastram
        pelo próprio app.
      </p>
    </div>
  );
}
