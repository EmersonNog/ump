import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, PartyPopper } from "lucide-react";
import { Cartao, cx } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { tituloCobranca, type Cobranca } from "@/lib/cobrancas";
import { data, hojeISO, moeda } from "@/lib/format";
import { FormEvento, FormMensalidades } from "./formularios";

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

  const linha = (c: Cobranca) => {
    const { pagos, analise } = contagem.get(c.id) ?? { pagos: 0, analise: 0 };
    // Mensalidade: só conta quem já era membro no mês de referência (igual à tela de detalhe).
    const elegiveis = (membros ?? []).filter(
      (m) => c.tipo === "evento" || m.created_at.slice(0, 7) <= (c.competencia ?? "").slice(0, 7),
    ).length;
    return (
      <li key={c.id}>
        <Link
          href={`/admin/cobrancas/${c.id}`}
          className={cx(
            "flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3.5 transition hover:border-brand-300",
            !c.ativa && "opacity-60",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {tituloCobranca(c)}
              {!c.ativa && <span className="ml-2 text-xs font-normal text-suave">(encerrada)</span>}
            </p>
            <p className="text-sm text-suave">
              {moeda(c.valor)}
              {c.vencimento && ` · vence ${data(c.vencimento)}`}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold text-brand-700 dark:text-brand-300">
              {pagos}/{Math.max(elegiveis, pagos)} pagos
            </p>
            {analise > 0 && <p className="text-amber-700 dark:text-amber-300">{analise} em análise</p>}
          </div>
          <ChevronRight className="size-5 text-suave" aria-hidden />
        </Link>
      </li>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
            <PartyPopper className="size-5 text-ouro-500" aria-hidden /> Eventos
          </h2>
          {eventos.length ? (
            <ul className="space-y-2">{eventos.map(linha)}</ul>
          ) : (
            <p className="text-sm text-suave">Nenhum evento cadastrado.</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
            <CalendarDays className="size-5 text-brand-500" aria-hidden /> Mensalidades
          </h2>
          {mensalidades.length ? (
            <ul className="space-y-2">{mensalidades.map(linha)}</ul>
          ) : (
            <p className="text-sm text-suave">Gere as mensalidades do ano ao lado.</p>
          )}
        </section>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Cartao>
          <h2 className="mb-4 font-semibold">Novo evento</h2>
          <FormEvento />
        </Cartao>
        <Cartao>
          <h2 className="mb-4 font-semibold">Gerar mensalidades do ano</h2>
          <FormMensalidades anoAtual={anoAtual} />
        </Cartao>
      </div>
    </div>
  );
}
