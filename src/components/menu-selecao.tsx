"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cx } from "./ui";

type Opcao = { valor: string; rotulo: string };

/**
 * Lista suspensa com o visual do app (no lugar do menu nativo do navegador).
 * Teclado: ↑/↓ escolhem, Enter/Espaço confirmam, Esc fecha. Fecha ao tocar fora.
 */
export function MenuSelecao({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  className,
}: {
  rotulo: string;
  valor: string;
  opcoes: Opcao[];
  aoMudar: (valor: string) => void;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [destaque, setDestaque] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const id = useId();
  const atual = opcoes.find((o) => o.valor === valor) ?? opcoes[0];

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: PointerEvent) => !raiz.current?.contains(e.target as Node) && setAberto(false);
    document.addEventListener("pointerdown", fora);
    return () => document.removeEventListener("pointerdown", fora);
  }, [aberto]);

  function abrir() {
    setDestaque(Math.max(0, opcoes.findIndex((o) => o.valor === valor)));
    setAberto(true);
  }

  function escolher(i: number) {
    aoMudar(opcoes[i].valor);
    setAberto(false);
    botao.current?.focus();
  }

  function teclas(e: KeyboardEvent) {
    if (!aberto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setAberto(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setDestaque((d) => Math.min(opcoes.length - 1, d + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDestaque((d) => Math.max(0, d - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      escolher(destaque);
    } else if (e.key === "Tab") {
      setAberto(false);
    }
  }

  return (
    <div ref={raiz} className={cx("relative", className)}>
      <button
        ref={botao}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={aberto}
        aria-controls={`${id}-lista`}
        aria-label={`${rotulo}: ${atual?.rotulo}`}
        onClick={() => (aberto ? setAberto(false) : abrir())}
        onKeyDown={teclas}
        className={cx(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-superficie px-3.5 text-sm font-semibold tabular-nums transition",
          aberto ? "border-laranja-500 ring-2 ring-laranja-500/35" : "border-borda hover:border-laranja-300",
        )}
      >
        {atual?.rotulo}
        <ChevronDown className={cx("size-4 text-suave transition", aberto && "rotate-180")} aria-hidden />
      </button>
      {aberto && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label={rotulo}
          className="animate-entrar absolute top-full left-0 z-30 mt-1.5 w-full min-w-40 overflow-hidden rounded-xl border border-borda bg-superficie p-1 shadow-lg shadow-azul-950/10"
        >
          {opcoes.map((o, i) => {
            const selecionada = o.valor === valor;
            return (
              <li
                key={o.valor || "vazio"}
                role="option"
                aria-selected={selecionada}
                onPointerEnter={() => setDestaque(i)}
                onClick={() => escolher(i)}
                className={cx(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm tabular-nums transition",
                  i === destaque ? "bg-laranja-50 dark:bg-laranja-950/50" : "",
                  selecionada ? "font-semibold text-laranja-800 dark:text-laranja-300" : "text-texto",
                )}
              >
                {o.rotulo}
                {selecionada && <Check className="size-4" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
