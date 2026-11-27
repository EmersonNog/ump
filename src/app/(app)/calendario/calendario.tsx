"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { cx } from "@/components/ui";
import { CartaoEvento, FormEvento, type EventoAgenda } from "./evento";

export type { EventoAgenda };

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const NOMES_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });
const nomeMesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const diaLongo = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/** Hoje no fuso de Brasília, "YYYY-MM-DD". */
function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** "YYYY-MM" deslocado `n` meses. */
function somarMes(mes: string, n: number) {
  return new Date(Date.UTC(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)) - 1 + n, 1)).toISOString().slice(0, 7);
}

const dataUTC = (iso: string) => new Date(`${iso}T00:00:00Z`);
const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

type Formulario = { data: string; evento?: EventoAgenda } | null;

/**
 * Agenda da UMP. Abre no mês atual (ou no dia vindo de uma notificação) e, se o mês virar com a tela
 * aberta ou o app voltar do segundo plano em outro mês, passa sozinho para o mês novo. A pessoa navega
 * livremente pelas setas, deslizando o dedo ou pelas setas do teclado. Tocar num dia mostra a programação
 * e os botões "Vou" / "Não vou"; a diretoria também adiciona e edita eventos ali.
 */
export function Calendario({
  eventos,
  hojeInicial,
  dataInicial,
  admin,
}: {
  eventos: EventoAgenda[];
  hojeInicial: string;
  dataInicial: string | null;
  admin: boolean;
}) {
  const router = useRouter();
  const [hoje, setHoje] = useState(hojeInicial);
  const [mes, setMes] = useState((dataInicial ?? hojeInicial).slice(0, 7));
  const [dia, setDia] = useState<string>(dataInicial ?? hojeInicial);
  const [direcao, setDirecao] = useState<1 | -1 | 0>(0);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const hojeRef = useRef(hojeInicial);
  const mesRef = useRef(mes);
  const diaRef = useRef(dia);
  const toqueX = useRef<number | null>(null);
  const fecharFormulario = useCallback(() => setFormulario(null), []);

  useEffect(() => {
    mesRef.current = mes;
    diaRef.current = dia;
  }, [mes, dia]);

  // Acompanha a virada do dia/mês: a cada 30 s e sempre que o app volta a ficar visível.
  useEffect(() => {
    function conferir() {
      const novo = hojeSP();
      const antigo = hojeRef.current;
      if (novo === antigo) return;
      hojeRef.current = novo;
      setHoje(novo);
      // Quem estava olhando o mês que acabou vai para o mês novo; quem navegou para outro mês fica onde está.
      if (novo.slice(0, 7) !== antigo.slice(0, 7)) {
        if (mesRef.current === antigo.slice(0, 7)) {
          setDirecao(1);
          setMes(novo.slice(0, 7));
          setDia(novo);
        }
      } else if (diaRef.current === antigo) {
        setDia(novo);
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
    // No mês atual, seleciona hoje; nos outros, o dia 1.
    setDia(novoMes === hoje.slice(0, 7) ? hoje : `${novoMes}-01`);
    setFormulario(null);
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
  const nomeDoMes = nomeMes.format(dataUTC(`${mes}-01`));

  const porDia = new Map<string, EventoAgenda[]>();
  for (const e of eventos) porDia.set(e.data, [...(porDia.get(e.data) ?? []), e]);
  const doDia = porDia.get(dia) ?? [];
  const proximos = eventos.filter((e) => e.data > dia && e.data >= hoje).slice(0, 3);

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
      <section
        aria-label="Calendário"
        className="rounded-2xl border border-borda bg-superficie p-4 sm:p-5 md:sticky md:top-24"
        onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
        onTouchEnd={aoSoltar}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") irPara(somarMes(mes, -1));
          if (e.key === "ArrowRight") irPara(somarMes(mes, 1));
        }}
      >
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 flex-1 font-display text-xl font-bold tracking-tight" aria-live="polite">
            {capitalizar(nomeMesAno.format(dataUTC(`${mes}-01`)))}
          </h2>
          {mes !== hoje.slice(0, 7) && (
            <button
              type="button"
              onClick={() => irPara(hoje.slice(0, 7))}
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
              const daquele = porDia.get(iso) ?? [];
              const ehHoje = iso === hoje;
              const selecionado = iso === dia;
              const passou = iso < hoje;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    setDia(iso);
                    setFormulario(null);
                  }}
                  aria-pressed={selecionado}
                  aria-label={`${i + 1} de ${nomeDoMes}, ${NOMES_SEMANA[(primeiroDiaSemana + i) % 7]}${ehHoje ? ", hoje" : ""}${
                    daquele.length ? `, ${daquele.length} ${daquele.length === 1 ? "evento" : "eventos"}` : ""
                  }`}
                  className={cx(
                    "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-xl text-sm tabular-nums transition",
                    selecionado
                      ? "bg-azul-700 font-semibold text-white dark:bg-azul-500"
                      : ehHoje
                        ? "bg-laranja-500 font-bold text-azul-950"
                        : daquele.length
                          ? "bg-laranja-50 font-semibold text-laranja-900 hover:bg-laranja-100 dark:bg-laranja-950/50 dark:text-laranja-100"
                          : cx("hover:bg-fundo", passou ? "text-suave" : "text-texto/85"),
                  )}
                >
                  {i + 1}
                  <span className="flex h-1.5 gap-0.5" aria-hidden>
                    {daquele.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className={cx(
                          "size-1.5 rounded-full",
                          selecionado || ehHoje ? "bg-current" : e.minhaResposta === true ? "bg-emerald-500" : "bg-laranja-500",
                        )}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-borda pt-3 text-xs text-suave">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-laranja-500" aria-hidden /> Tem evento
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden /> Você confirmou
          </span>
        </div>
      </section>

      <section aria-live="polite" className="space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-borda pb-3">
          <h2 className="font-semibold">{capitalizar(diaLongo.format(dataUTC(dia)))}</h2>
          {admin && !formulario && (
            <button
              type="button"
              onClick={() => setFormulario({ data: dia })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-laranja-500 px-3.5 text-sm font-semibold text-azul-950 transition hover:bg-laranja-400"
            >
              <Plus className="size-4" aria-hidden /> Evento
            </button>
          )}
        </div>

        {formulario && (
          <FormEvento
            key={formulario.evento?.id ?? formulario.data}
            data={formulario.data}
            evento={formulario.evento}
            aoFechar={fecharFormulario}
          />
        )}

        {doDia.length === 0 ? (
          <p className="py-6 text-center text-sm text-suave">
            Nenhum evento neste dia.
            {admin && !formulario && " Toque em “Evento” para adicionar."}
          </p>
        ) : (
          doDia.map((e) => (
            <CartaoEvento
              key={e.id}
              evento={e}
              hoje={hoje}
              admin={admin}
              aoEditar={() => setFormulario({ data: e.data, evento: e })}
            />
          ))
        )}

        {proximos.length > 0 && (
          <div className="pt-4">
            <p className="mb-2 text-sm font-semibold text-suave">Próximos eventos</p>
            <ul className="divide-y divide-borda rounded-2xl border border-borda bg-superficie">
              {proximos.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (e.data.slice(0, 7) !== mes) {
                        setDirecao(e.data.slice(0, 7) > mes ? 1 : -1);
                        setMes(e.data.slice(0, 7));
                      }
                      setDia(e.data);
                      setFormulario(null);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-fundo"
                  >
                    <span className="w-14 shrink-0 text-sm font-semibold text-laranja-700 tabular-nums dark:text-laranja-300">
                      {e.data.slice(8)}/{e.data.slice(5, 7)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium">{e.titulo}</span>
                    {e.minhaResposta !== null && (
                      <span
                        className={cx(
                          "shrink-0 text-xs font-semibold",
                          e.minhaResposta ? "text-emerald-700 dark:text-emerald-300" : "text-suave",
                        )}
                      >
                        {e.minhaResposta ? "Vou" : "Não vou"}
                      </span>
                    )}
                    <ChevronRight className="size-4 shrink-0 text-suave" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
