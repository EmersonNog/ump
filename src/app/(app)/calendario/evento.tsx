"use client";

import { Check, Clock, MapPin, Pencil, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useOptimistic, useState, useTransition } from "react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { AreaTexto, Aviso, Botao, Campo, Entrada, cx } from "@/components/ui";
import { excluirEventoAgenda, responderPresenca, salvarEventoAgenda } from "./actions";

export type EventoAgenda = {
  id: string;
  titulo: string;
  /** "YYYY-MM-DD" */
  data: string;
  /** "HH:MM" */
  hora: string | null;
  local: string | null;
  descricao: string | null;
  minhaResposta: boolean | null;
  vao: number;
  naoVao: number;
  /** Só para a diretoria. */
  nomesVao?: string[];
  nomesNaoVao?: string[];
};

const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Cartão de uma programação: detalhes, quem vai e (para o membro) os botões "Vou" / "Não vou". */
export function CartaoEvento({ evento, hoje, admin, aoEditar }: { evento: EventoAgenda; hoje: string; admin: boolean; aoEditar: () => void }) {
  // Resposta otimista: muda na hora do toque e volta sozinha se o servidor recusar.
  const [resposta, setRespostaOtimista] = useOptimistic(evento.minhaResposta);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const passou = evento.data < hoje;

  function responder(vai: boolean) {
    const nova = resposta === vai ? null : vai;
    setErro(null);
    iniciar(async () => {
      setRespostaOtimista(nova);
      const r = await responderPresenca(evento.id, nova);
      if (r.erro) setErro(r.erro);
    });
  }

  // Contagem já considerando a resposta otimista do próprio membro.
  const ajuste = (valor: boolean) => (resposta === valor ? 1 : 0) - (evento.minhaResposta === valor ? 1 : 0);
  const vao = evento.vao + ajuste(true);
  const naoVao = evento.naoVao + ajuste(false);
  const dia = new Date(`${evento.data}T00:00:00Z`);

  return (
    <article className={cx("rounded-2xl border border-borda bg-superficie p-4", passou && "opacity-75")}>
      <div className="flex items-start gap-3.5">
        <div className="grid w-12 shrink-0 rounded-xl bg-laranja-50 py-1.5 text-center leading-tight text-laranja-800 dark:bg-laranja-950/60 dark:text-laranja-200">
          <span className="font-display text-xl font-bold tabular-nums">{Number(evento.data.slice(8))}</span>
          <span className="text-[11px] font-medium">{diaSemana.format(dia).replace(".", "")}</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug break-words">{evento.titulo}</h3>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-suave">
            {evento.hora && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden /> {evento.hora.replace(":", "h")}
              </span>
            )}
            {evento.local && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{evento.local}</span>
              </span>
            )}
          </p>
        </div>
        {admin && (
          <div className="-mt-1 -mr-1 flex shrink-0">
            <button
              type="button"
              onClick={aoEditar}
              aria-label={`Editar ${evento.titulo}`}
              className="grid size-9 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-texto"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setConfirmarExclusao(true)}
              aria-label={`Excluir ${evento.titulo}`}
              className="grid size-9 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-red-700 dark:hover:text-red-400"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {evento.descricao && <p className="mt-3 text-sm whitespace-pre-line text-texto/85">{evento.descricao}</p>}

      {confirmarExclusao && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          <span className="flex-1">Excluir este evento e as respostas?</span>
          <Botao
            variante="perigo"
            className="h-9 px-3"
            disabled={pendente}
            onClick={() =>
              iniciar(async () => {
                const r = await excluirEventoAgenda(evento.id);
                if (r.erro) setErro(r.erro);
              })
            }
          >
            Excluir
          </Botao>
          <Botao variante="fantasma" className="h-9 px-3" onClick={() => setConfirmarExclusao(false)}>
            Cancelar
          </Botao>
        </div>
      )}

      {erro && (
        <div className="mt-3">
          <Aviso>{erro}</Aviso>
        </div>
      )}

      {/* Presença */}
      <div className="mt-4 border-t border-borda pt-3">
        {passou ? (
          <p className="text-sm text-suave">
            Já aconteceu
            {resposta !== null && ` · você ${resposta ? "foi confirmado" : "disse que não iria"}`}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2" role="group" aria-label={`Você vai em ${evento.titulo}?`}>
            <button
              type="button"
              aria-pressed={resposta === true}
              onClick={() => responder(true)}
              className={cx(
                "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                resposta === true
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-borda text-texto hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300",
              )}
            >
              <Check className="size-4" aria-hidden /> Vou
            </button>
            <button
              type="button"
              aria-pressed={resposta === false}
              onClick={() => responder(false)}
              className={cx(
                "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition",
                resposta === false
                  ? "border-red-700 bg-red-700 text-white"
                  : "border-borda text-texto hover:border-red-400 hover:text-red-700 dark:hover:text-red-300",
              )}
            >
              <X className="size-4" aria-hidden /> Não vou
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-suave tabular-nums">
          {plural(vao, "vai", "vão")} · {plural(naoVao, "não vai", "não vão")}
        </p>
        {admin && vao + naoVao > 0 && (
          <details className="group mt-2 text-sm">
            <summary className="cursor-pointer font-medium text-azul-700 select-none dark:text-azul-300">Ver quem respondeu</summary>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <ListaNomes titulo="Vão" nomes={evento.nomesVao ?? []} cor="bg-emerald-500" />
              <ListaNomes titulo="Não vão" nomes={evento.nomesNaoVao ?? []} cor="bg-red-500" />
            </div>
          </details>
        )}
      </div>
    </article>
  );
}

function ListaNomes({ titulo, nomes, cor }: { titulo: string; nomes: string[]; cor: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-suave">
        <span className={cx("size-1.5 rounded-full", cor)} aria-hidden /> {titulo} ({nomes.length})
      </p>
      {nomes.length ? (
        <ul className="mt-1 space-y-0.5">
          {nomes.map((n) => (
            <li key={n} className="truncate">
              {n}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-suave">Ninguém</p>
      )}
    </div>
  );
}

/** Formulário da diretoria para adicionar (ou editar) uma programação. */
export function FormEvento({ data, evento, aoFechar }: { data: string; evento?: EventoAgenda; aoFechar: () => void }) {
  const [estado, acao] = useActionState(salvarEventoAgenda, {});

  useEffect(() => {
    if (estado.sucesso) aoFechar();
  }, [estado, aoFechar]);

  return (
    <form action={acao} className="space-y-4 rounded-2xl border border-laranja-200 bg-superficie p-4 dark:border-laranja-900">
      <p className="font-semibold">{evento ? "Editar evento" : "Novo evento"}</p>
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {evento && <input type="hidden" name="id" value={evento.id} />}
      <Campo rotulo="Nome">
        <Entrada name="titulo" defaultValue={evento?.titulo} placeholder="Ex.: Culto jovem, Ensaio do coral" required maxLength={120} />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Data">
          <Entrada name="data" type="date" defaultValue={evento?.data ?? data} required />
        </Campo>
        <Campo rotulo="Horário" dica="Opcional">
          <Entrada name="hora" type="time" defaultValue={evento?.hora ?? ""} />
        </Campo>
      </div>
      <Campo rotulo="Local" dica="Opcional">
        <Entrada name="local" defaultValue={evento?.local ?? ""} placeholder="Ex.: Templo da IP Jóquei" maxLength={120} />
      </Campo>
      <Campo rotulo="Descrição" dica="Opcional">
        <AreaTexto name="descricao" defaultValue={evento?.descricao ?? ""} maxLength={1000} placeholder="O que levar, tema, preletor…" />
      </Campo>
      {!evento && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-texto/80 select-none">
          <input type="checkbox" name="avisar" defaultChecked className="size-4 shrink-0 accent-laranja-600" />
          Notificar os membros
        </label>
      )}
      <div className="flex gap-2">
        <BotaoEnviar className="flex-1">{evento ? "Salvar" : "Adicionar ao calendário"}</BotaoEnviar>
        <Botao type="button" variante="secundario" onClick={aoFechar}>
          Cancelar
        </Botao>
      </div>
    </form>
  );
}
