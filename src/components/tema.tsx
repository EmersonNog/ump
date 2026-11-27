"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useLayoutEffect, useState } from "react";
import { definirPreferencia, lerPreferencia, reaplicarTema, temaAtual, type PreferenciaTema } from "@/lib/tema";
import { cx } from "./ui";

/** Em desenvolvimento o React remonta <html> e apaga o atributo; reaplica antes da pintura. */
export function SincronizarTema() {
  useLayoutEffect(() => reaplicarTema(), []);
  return null;
}

function useTema() {
  const [estado, setEstado] = useState<{ preferencia: PreferenciaTema; atual: "claro" | "escuro" } | null>(null);
  useEffect(() => {
    const ler = () => setEstado({ preferencia: lerPreferencia(), atual: temaAtual() });
    ler();
    window.addEventListener("ump:tema", ler);
    const midia = matchMedia("(prefers-color-scheme: dark)");
    midia.addEventListener("change", ler);
    return () => {
      window.removeEventListener("ump:tema", ler);
      midia.removeEventListener("change", ler);
    };
  }, []);
  return estado;
}

/** Centro do botão tocado: ponto de onde o novo tema se espalha. */
function centro(elemento: HTMLElement) {
  const r = elemento.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Botão rápido (cabeçalho): alterna entre claro e escuro. */
export function BotaoTema({ className }: { className?: string }) {
  const tema = useTema();
  const escuro = tema?.atual === "escuro";
  return (
    <button
      type="button"
      onClick={(e) => definirPreferencia(escuro ? "claro" : "escuro", centro(e.currentTarget))}
      aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
      title={escuro ? "Tema claro" : "Tema escuro"}
      className={cx(
        "grid size-9 place-items-center rounded-full text-suave transition hover:bg-laranja-50 hover:text-texto dark:hover:bg-azul-950",
        className,
      )}
    >
      {/* Antes de montar, mostra a lua (evita divergência de hidratação). */}
      {escuro ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

const OPCOES: { valor: PreferenciaTema; rotulo: string; Icone: typeof Sun }[] = [
  { valor: "claro", rotulo: "Claro", Icone: Sun },
  { valor: "escuro", rotulo: "Escuro", Icone: Moon },
  { valor: "sistema", rotulo: "Automático", Icone: Monitor },
];

/** Escolha completa (Perfil): claro, escuro ou seguir o sistema. */
export function EscolhaTema() {
  const tema = useTema();
  return (
    <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-1 rounded-xl bg-fundo p-1">
      {OPCOES.map(({ valor, rotulo, Icone }) => {
        const ativo = tema?.preferencia === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={(e) => definirPreferencia(valor, centro(e.currentTarget))}
            className={cx(
              "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
              ativo ? "bg-superficie text-texto shadow-sm" : "text-suave hover:text-texto",
            )}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </button>
        );
      })}
    </div>
  );
}
