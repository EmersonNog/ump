"use client";

import { useState, useTransition } from "react";
import { cancelarPagamento } from "../actions";

/** Cancelar envio em análise, com confirmação no próprio lugar (sem pop-up do navegador). */
export function BotaoCancelar({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (erro) {
    return (
      <span role="alert" className="text-red-700 dark:text-red-400">
        {erro}
      </span>
    );
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="font-medium text-red-700 transition hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
      >
        Cancelar envio
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-3">
      <span className="text-texto">Cancelar este envio?</span>
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            const r = await cancelarPagamento(id);
            if (r.erro) setErro(r.erro);
          })
        }
        className="font-semibold text-red-700 disabled:opacity-50 dark:text-red-400"
      >
        {pendente ? "Cancelando…" : "Sim, cancelar"}
      </button>
      <button type="button" disabled={pendente} onClick={() => setConfirmando(false)} className="font-medium text-suave">
        Não
      </button>
    </span>
  );
}
