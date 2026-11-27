"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Botao } from "./ui";

/** Copia um texto (Pix copia e cola ou chave). `descricao` diz o que é copiado para leitores de tela. */
export function CopiarPix({
  texto,
  rotulo = "Copiar",
  descricao,
  grande = false,
}: {
  texto: string;
  rotulo?: string;
  descricao?: string;
  grande?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    navigator.vibrate?.(30);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <>
      <Botao
        type="button"
        onClick={copiar}
        aria-label={descricao}
        variante={grande ? "primario" : "secundario"}
        className={grande ? "w-full" : "shrink-0"}
      >
        {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        {copiado ? "Copiado" : rotulo}
      </Botao>
      <span className="sr-only" aria-live="polite">
        {copiado ? `${descricao ?? rotulo}: copiado` : ""}
      </span>
    </>
  );
}
