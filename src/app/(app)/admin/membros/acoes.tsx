"use client";

import { useState, useTransition } from "react";
import { Aviso } from "@/components/ui";
import { atualizarMembro } from "../actions";

export function AcoesMembro({
  id,
  papel,
  ativo,
  euMesmo,
}: {
  id: string;
  papel: "membro" | "admin";
  ativo: boolean;
  euMesmo: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function aplicar(mudanca: Parameters<typeof atualizarMembro>[1], confirmacao: string) {
    if (!confirm(confirmacao)) return;
    iniciar(async () => {
      const r = await atualizarMembro(id, mudanca);
      setErro(r.erro ?? null);
    });
  }

  const estiloBotao = "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:bg-fundo disabled:opacity-50";

  return (
    <div className="mt-3 border-t border-borda pt-2">
      {erro && <div className="mb-2"><Aviso>{erro}</Aviso></div>}
      <div className="flex flex-wrap justify-end gap-1">
        <button
          type="button"
          disabled={pendente}
          className={`${estiloBotao} text-brand-700 dark:text-brand-300`}
          onClick={() =>
            papel === "admin"
              ? aplicar({ papel: "membro" }, euMesmo ? "Remover seu próprio acesso de administrador?" : "Remover acesso de administrador?")
              : aplicar({ papel: "admin" }, "Tornar este membro administrador? Ele poderá conferir comprovantes e gerenciar cobranças.")
          }
        >
          {papel === "admin" ? "Remover admin" : "Tornar admin"}
        </button>
        {!euMesmo && (
          <button
            type="button"
            disabled={pendente}
            className={`${estiloBotao} ${ativo ? "text-red-600 dark:text-red-400" : "text-brand-700 dark:text-brand-300"}`}
            onClick={() =>
              aplicar(
                { ativo: !ativo },
                ativo ? "Desativar este membro? Ele deixa de aparecer nas listas de cobrança." : "Reativar este membro?",
              )
            }
          >
            {ativo ? "Desativar" : "Reativar"}
          </button>
        )}
      </div>
    </div>
  );
}
