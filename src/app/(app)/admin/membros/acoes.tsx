"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { cx } from "@/components/ui";
import { atualizarMembro } from "../actions";

export function AcoesMembro({
  id,
  papel,
  ativo,
  euMesmo,
  empilhado = false,
}: {
  id: string;
  papel: "membro" | "admin";
  ativo: boolean;
  euMesmo: boolean;
  /** Itens de menu um embaixo do outro (lista do celular). */
  empilhado?: boolean;
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

  const estiloBotao = empilhado
    ? "w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition hover:bg-fundo disabled:opacity-50"
    : "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition hover:bg-fundo disabled:opacity-50";

  return (
    <div>
      {erro && <p className={cx("mb-1 text-xs text-red-700 dark:text-red-400", empilhado ? "px-3 pt-2" : "text-right")}>{erro}</p>}
      <div className={empilhado ? "flex flex-col" : "flex justify-end gap-1 whitespace-nowrap"}>
        <button
          type="button"
          disabled={pendente}
          className={`${estiloBotao} text-azul-700 dark:text-azul-300`}
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
            className={`${estiloBotao} ${ativo ? "text-red-700 dark:text-red-400" : "text-azul-700 dark:text-azul-300"}`}
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

/** Menu "⋯" do cartão do membro (celular). Fecha ao tocar fora ou ao apertar Esc. */
export function MenuMembro({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function fora(evento: PointerEvent) {
      const menu = ref.current;
      if (menu?.open && !menu.contains(evento.target as Node)) menu.open = false;
    }
    function tecla(evento: KeyboardEvent) {
      const menu = ref.current;
      if (evento.key === "Escape" && menu?.open) {
        menu.open = false;
        menu.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", fora);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fora);
      document.removeEventListener("keydown", tecla);
    };
  }, []);

  return (
    <details ref={ref} className="relative shrink-0 [&_summary::-webkit-details-marker]:hidden">
      <summary
        aria-label={rotulo}
        className="grid size-9 cursor-pointer list-none place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-texto"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </summary>
      <div className="absolute top-10 right-0 z-10 w-48 rounded-xl border border-borda bg-superficie p-1 shadow-lg">
        {children}
      </div>
    </details>
  );
}
