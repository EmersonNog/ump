"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Aviso, Botao } from "@/components/ui";
import { alternarCobranca, excluirCobranca } from "../../actions";

export function AcoesCobranca({ id, ativa }: { id: string; ativa: boolean }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {erro && <Aviso>{erro}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <Botao
          variante="secundario"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              const r = await alternarCobranca(id, !ativa);
              setErro(r.erro ?? null);
            })
          }
        >
          {ativa ? <Archive className="size-4" aria-hidden /> : <ArchiveRestore className="size-4" aria-hidden />}
          {ativa ? "Encerrar cobrança" : "Reabrir cobrança"}
        </Botao>
        <Botao
          variante="fantasma"
          className="text-red-700! dark:text-red-400!"
          disabled={pendente}
          onClick={() => {
            if (!confirm("Excluir esta cobrança definitivamente?")) return;
            iniciar(async () => {
              const r = await excluirCobranca(id);
              if (r?.erro) setErro(r.erro);
            });
          }}
        >
          <Trash2 className="size-4" aria-hidden /> Excluir
        </Botao>
      </div>
      <p className="text-xs text-suave">Cobranças encerradas somem da tela dos membros, mas o histórico é mantido.</p>
    </div>
  );
}
