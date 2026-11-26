"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { cx } from "./ui";

export function CopiarPix({ texto, rotulo = "Copiar", grande = false }: { texto: string; rotulo?: string; grande?: boolean }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    navigator.vibrate?.(30);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-ouro-400 font-bold text-brand-950 transition active:scale-95",
        grande ? "h-11 w-full rounded-xl px-4 text-sm" : "h-9 px-3 text-xs",
      )}
    >
      {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}
