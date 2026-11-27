import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { EtiquetaData } from "@/components/etiqueta-data";
import { BotaoLink, CabecalhoSecao, cx } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { type Cobranca } from "@/lib/cobrancas";
import { competencia, data, hojeISO, moeda } from "@/lib/format";

export const metadata: Metadata = { title: "Cobranças" };

export default async function PaginaCobrancas() {
  const { supabase } = await exigirAdmin();

  const [{ data: cobrancas }, { data: pagamentos }, { data: membros }] = await Promise.all([
    supabase
      .from("cobrancas")
      .select("*")
      .order("ativa", { ascending: false })
      .order("competencia", { ascending: false, nullsFirst: true })
      .order("created_at", { ascending: false }),
    supabase.from("pagamentos").select("cobranca_id, status").neq("status", "nao_pago"),
    supabase.from("profiles").select("created_at").eq("ativo", true),
  ]);

  const contagem = new Map<string, { pagos: number; analise: number }>();
  for (const p of pagamentos ?? []) {
    const c = contagem.get(p.cobranca_id) ?? { pagos: 0, analise: 0 };
    if (p.status === "pago") c.pagos++;
    else c.analise++;
    contagem.set(p.cobranca_id, c);
  }

  const eventos = (cobrancas ?? []).filter((c) => c.tipo === "evento");
  const mensalidades = (cobrancas ?? []).filter((c) => c.tipo === "mensalidade");
  const anoAtual = Number(hojeISO().slice(0, 4));

  // Mensalidades agrupadas por ano de competência (mais recente primeiro), mantendo a ordem da consulta.
  const porAno = new Map<string, Cobranca[]>();
  for (const c of mensalidades) {
    const ano = (c.competencia ?? "").slice(0, 4) || "Sem ano";
    porAno.set(ano, [...(porAno.get(ano) ?? []), c]);
  }
  const anos = [...porAno.keys()].sort((a, b) => b.localeCompare(a));

  // Mensalidade: só conta quem já era membro no mês de referência (igual à tela de detalhe).
  const elegiveisDe = (c: Cobranca) =>
    (membros ?? []).filter((m) => c.tipo === "evento" || m.created_at.slice(0, 7) <= (c.competencia ?? "").slice(0, 7))
      .length;

  const linha = (c: Cobranca) => {
    const { pagos, analise } = contagem.get(c.id) ?? { pagos: 0, analise: 0 };
    const total = Math.max(elegiveisDe(c), pagos);
    const progresso = total > 0 ? Math.round((pagos / total) * 100) : 0;
    return (
      <li key={c.id}>
        <Link
          href={`/admin/cobrancas/${c.id}`}
          className={cx(
            "-mx-2 flex items-center gap-4 rounded-xl px-2 py-4 transition hover:bg-superficie",
            !c.ativa && "opacity-60",
          )}
        >
          <EtiquetaData cobranca={c} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 leading-snug font-medium">
              {c.tipo === "mensalidade" && c.competencia ? competencia(c.competencia) : c.titulo}
            </p>
            <p className="truncate text-sm text-suave">
              <span className="tabular-nums">{moeda(c.valor)}</span>
              {c.vencimento && ` · vence ${data(c.vencimento)}`}
              {!c.ativa && " · Encerrada"}
            </p>
          </div>
          <div className="w-20 shrink-0 text-right">
            <p className="text-sm whitespace-nowrap tabular-nums">
              {pagos}/{total} <span className="text-suave">pagos</span>
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-borda" aria-hidden>
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progresso}%` }} />
            </div>
            {analise > 0 && (
              <p className="mt-1 text-xs whitespace-nowrap text-azul-600 tabular-nums dark:text-azul-300">
                {analise} em análise
              </p>
            )}
          </div>
          <ChevronRight className="-mr-1 size-4 shrink-0 text-suave" aria-hidden />
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <BotaoLink href="/admin/cobrancas/nova" className="max-sm:w-full">
          <Plus className="size-4" aria-hidden /> Nova cobrança
        </BotaoLink>
      </div>

      <div className="min-w-0 space-y-8">
        <section>
          <CabecalhoSecao titulo="Eventos" detalhe={eventos.length || undefined} />
          {eventos.length ? (
            <ul className="divide-y divide-borda">{eventos.map(linha)}</ul>
          ) : (
            <p className="py-6 text-sm text-suave">Nenhum evento cadastrado.</p>
          )}
        </section>

        {anos.length ? (
          [...porAno]
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([ano, lista]) => {
              // Meses antes de qualquer cadastro não têm a quem cobrar: ficam recolhidos para não poluir a lista.
              const semMembros = lista.filter((c) => elegiveisDe(c) === 0 && !contagem.has(c.id));
              const comMembros = lista.filter((c) => !semMembros.includes(c));
              return (
                <section key={ano}>
                  <CabecalhoSecao titulo={`Mensalidades ${ano}`} detalhe={lista.length} />
                  <ul className="divide-y divide-borda">{comMembros.map(linha)}</ul>
                  {semMembros.length > 0 && (
                    <details className="group border-t border-borda">
                      <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-sm text-suave hover:text-texto [&::-webkit-details-marker]:hidden">
                        {semMembros.length} {semMembros.length === 1 ? "mês" : "meses"} sem membros cadastrados na época
                        <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
                      </summary>
                      <ul className="divide-y divide-borda">{semMembros.map(linha)}</ul>
                    </details>
                  )}
                </section>
              );
            })
        ) : (
          <section>
            <CabecalhoSecao titulo={`Mensalidades ${anoAtual}`} />
            <p className="py-6 text-sm text-suave">
              Nenhuma mensalidade ainda. Use “Nova cobrança” e escolha Mensalidades.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
