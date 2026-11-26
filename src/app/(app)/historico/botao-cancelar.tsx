"use client";

import { useTransition } from "react";
import { cancelarPagamento } from "../actions";

export function BotaoCancelar({ id }: { id: string }) {
  const [pendente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendente}
      className="font-semibold text-red-600 disabled:opacity-50 dark:text-red-400"
      onClick={() => {
        if (!confirm("Cancelar este envio? Você poderá enviar outro comprovante depois.")) return;
        iniciar(async () => {
          const { erro } = await cancelarPagamento(id);
          if (erro) alert(erro);
        });
      }}
    >
      {pendente ? "Cancelando…" : "Cancelar envio"}
    </button>
  );
}
