"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import { prazo } from "@/lib/cobrancas";
import { moeda } from "@/lib/format";
import { cx, pontoSituacao, Selo, type Situacao } from "./ui";

export type ItemCalendario = {
  id: string;
  titulo: string;
  tipo: "mensalidade" | "evento";
  valor: number;
  /** "YYYY-MM-DD" */
  vencimento: string;
  situacao: Situacao;
  motivo: string | null;
};

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOMES_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const nomeMesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const LEGENDA: Situacao[] = ["pago", "em_analise", "pendente", "nao_pago"];
const ROTULOS: Record<Situacao, string> = { pago: "Pago", em_analise: "Em análise", pendente: "Em aberto", nao_pago: "Não pago" };

/** Hoje no fuso de Brasília, "YYYY-MM-DD". */
function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** "YYYY-MM" deslocado `n` meses. */
function somarMes(mes: string, n: number) {
  const d = new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

const dataUTC = (iso: string) => new Date(`${iso}T00:00:00Z`);
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/**
 * Calendário de vencimentos. Abre no mês atual e, se o mês virar com a tela aberta (ou o app voltar
 * do segundo plano em outro mês), passa sozinho para o mês novo. A pessoa também navega livremente
 * pelas setas, deslizando o dedo para os lados ou pelas setas do teclado.
 */
export function Calendario({ itens, hojeInicial }: { itens: ItemCalendario[]; hojeInicial: string }) {
  const router = useRouter();
  const [hoje, setHoje] = useState(hojeInicial);
  const [mes, setMes] = useState(hojeInicial.slice(0, 7));
  const [dia, setDia] = useState<string | null>(null);
  const [direcao, setDirecao] = useState<1 | -1 | 0>(0);
  const hojeRef = useRef(hojeInicial);
  const toqueX = useRef<number | null>(null);

  // Acompanha a virada do dia/mês: a cada 30 s e sempre que o app volta a ficar visível.
  useEffect(() => {
    function conferir() {
      const novo = hojeSP();
      const antigo = hojeRef.current;
      if (novo === antigo) return;
      hojeRef.current = novo;
      setHoje(novo);
      if (novo.slice(0, 7) !== antigo.slice(0, 7)) {
        // Quem estava olhando o mês que acabou vai para o mês novo; quem navegou para outro mês fica onde está.
        setMes((atual) => (atual === antigo.slice(0, 7) ? novo.slice(0, 7) : atual));
        setDirecao(1);
        setDia(null);
      }
      router.refresh();
    }
    conferir();
    const intervalo = setInterval(conferir, 30_000);
    const aoVoltar = () => document.visibilityState === "visible" && conferir();
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", conferir);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", conferir);
    };
  }, [router]);

  function irPara(novoMes: string) {
    if (novoMes === mes) return;
    setDirecao(novoMes > mes ? 1 : -1);
    setMes(novoMes);
    setDia(null);
  }

  function aoSoltar(evento: TouchEvent) {
    if (toqueX.current === null) return;
    const dx = evento.changedTouches[0].clientX - toqueX.current;
    toqueX.current = null;
    if (Math.abs(dx) > 50) irPara(somarMes(mes, dx < 0 ? 1 : -1));
  }

  const [ano, numMes] = [Number(mes.slice(0, 4)), Number(mes.slice(5, 7))];
  const primeiroDiaSemana = new Date(Date.UTC(ano, numMes - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(ano, numMes, 0)).getUTCDate();
  const mesAtual = hoje.slice(0, 7);

  const porDia = new Map<string, ItemCalendario[]>();
  for (const item of itens) {
    if (!item.vencimento.startsWith(mes)) continue;
    porDia.set(item.vencimento, [...(porDia.get(item.vencimento) ?? []), item]);
  }
  const doMes = itens.filter((i) => i.vencimento.startsWith(mes)).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const lista = dia ? (porDia.get(dia) ?? []) : doMes;
  const nomeDoMes = nomeMes.format(dataUTC(`${mes}-01`));

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:items-start">
      <section
        aria-label="Calendário"
        className="rounded-2xl border border-borda bg-superficie p-4 sm:p-5"
        onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
        onTouchEnd={aoSoltar}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" && e.target === e.currentTarget) irPara(somarMes(mes, -1));
          if (e.key === "ArrowRight" && e.target === e.currentTarget) irPara(somarMes(mes, 1));
        }}
        tabIndex={-1}
      >
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 font-display text-xl font-bold tracking-tight" aria-live="polite">
            {capitalizar(nomeMesAno.format(dataUTC(`${mes}-01`)))}
          </h2>
          {mes !== mesAtual && (
            <button
              type="button"
              onClick={() => irPara(mesAtual)}
              className="h-9 rounded-full border border-borda px-3.5 text-sm font-semibold text-azul-700 transition hover:bg-fundo dark:text-azul-300"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => irPara(somarMes(mes, -1))}
            aria-label="Mês anterior"
            className="grid size-9 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-texto"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => irPara(somarMes(mes, 1))}
            aria-label="Próximo mês"
            className="grid size-9 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-texto"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        <div
          key={mes}
          className={cx("mt-4", direcao === 1 && "animate-mes-proximo", direcao === -1 && "animate-mes-anterior", "motion-reduce:animate-none")}
        >
          <div className="grid grid-cols-7 text-center text-xs font-medium text-suave" aria-hidden>
            {DIAS_SEMANA.map((d, i) => (
              <span key={i} className="py-1.5">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primeiroDiaSemana }, (_, i) => (
              <span key={`vazio-${i}`} />
            ))}
            {Array.from({ length: diasNoMes }, (_, i) => {
              const iso = `${mes}-${String(i + 1).padStart(2, "0")}`;
              const doDia = porDia.get(iso) ?? [];
              const ehHoje = iso === hoje;
              const selecionado = iso === dia;
              const semana = NOMES_SEMANA[(primeiroDiaSemana + i) % 7];
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setDia(selecionado ? null : iso)}
                  aria-pressed={selecionado}
                  aria-label={`${i + 1} de ${nomeDoMes}, ${semana}${ehHoje ? ", hoje" : ""}${
                    doDia.length ? `, ${doDia.length} ${doDia.length === 1 ? "vencimento" : "vencimentos"}` : ""
                  }`}
                  className={cx(
                    "flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm tabular-nums transition",
                    selecionado
                      ? "bg-azul-700 font-semibold text-white dark:bg-azul-500"
                      : ehHoje
                        ? "bg-laranja-500 font-bold text-azul-950"
                        : doDia.length
                          ? "bg-fundo font-semibold hover:bg-laranja-50 dark:hover:bg-azul-950"
                          : "text-texto/80 hover:bg-fundo",
                  )}
                >
                  {i + 1}
                  <span className="flex h-1.5 gap-0.5" aria-hidden>
                    {doDia.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={cx("size-1.5 rounded-full", selecionado || ehHoje ? "bg-current" : pontoSituacao(item.situacao))}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-borda pt-3 text-xs text-suave">
          {LEGENDA.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={cx("size-2 rounded-full", pontoSituacao(s))} aria-hidden />
              {ROTULOS[s]}
            </span>
          ))}
        </div>
      </section>

      <section aria-live="polite">
        <div className="flex items-baseline justify-between gap-3 border-b border-borda pb-3 text-sm">
          <h2 className="font-semibold">
            {dia ? `Dia ${Number(dia.slice(8))} de ${nomeDoMes}` : `Vencimentos de ${nomeDoMes}`}
          </h2>
          {dia ? (
            <button type="button" onClick={() => setDia(null)} className="font-medium text-azul-700 hover:underline dark:text-azul-300">
              Ver o mês todo
            </button>
          ) : (
            doMes.length > 0 && <span className="text-suave tabular-nums">{doMes.length}</span>
          )}
        </div>
        {lista.length === 0 ? (
          <p className="py-8 text-center text-sm text-suave">
            {dia ? "Nada vence neste dia." : `Nada vence em ${nomeDoMes}.`}
          </p>
        ) : (
          <ul className="divide-y divide-borda">
            {lista.map((item) => (
              <LinhaCalendario key={item.id} item={item} hoje={hoje} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LinhaCalendario({ item, hoje }: { item: ItemCalendario; hoje: string }) {
  const podePagar = item.situacao === "pendente" || item.situacao === "nao_pago";
  const prazoItem = prazo(item.vencimento, hoje, podePagar);
  const detalhe =
    item.situacao === "nao_pago" && item.motivo
      ? { texto: `Não pago: ${item.motivo}`, classe: "text-red-700 dark:text-red-400" }
      : prazoItem && podePagar
        ? { texto: prazoItem.texto, classe: prazoItem.vencida ? "text-red-700 dark:text-red-400" : "text-suave" }
        : { texto: item.tipo === "evento" ? "Evento" : "Mensalidade", classe: "text-suave" };

  const conteudo = (
    <>
      <span className="grid w-11 shrink-0 text-center leading-tight">
        <span className="font-display text-xl font-bold tabular-nums">{Number(item.vencimento.slice(8))}</span>
        <span className="text-[11px] text-suave">{NOMES_SEMANA[dataUTC(item.vencimento).getUTCDay()].slice(0, 3)}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 leading-snug font-medium">{item.titulo}</span>
        <span className={cx("block truncate text-sm", detalhe.classe)}>{detalhe.texto}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-semibold tabular-nums">{moeda(item.valor)}</span>
        <Selo situacao={item.situacao} />
      </span>
    </>
  );

  return (
    <li>
      {podePagar ? (
        <Link href={`/pagar/${item.id}`} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-3.5 transition hover:bg-superficie">
          {conteudo}
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-3.5">{conteudo}</div>
      )}
    </li>
  );
}
