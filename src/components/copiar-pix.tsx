"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopiarPix({ chave }: { chave: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(chave);
    setCopiado(true);
    navigator.vibrate?.(30);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-ouro-400 px-3 text-xs font-bold text-brand-950 transition active:scale-95"
    >
      {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copiado ? "Copiado!" : "Copiar"}
    </button>
  );
}
