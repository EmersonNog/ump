"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, RotateCcw, X } from "lucide-react";
import { AreaTexto, Aviso, Botao, Campo } from "@/components/ui";
import { revisarPagamento } from "../../actions";

type Status = "em_analise" | "pago" | "nao_pago";

export function Revisao({ id, status, motivoAtual }: { id: string; status: Status; motivoAtual: string }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState(motivoAtual);
  const [recusando, setRecusando] = useState(false);
  const [acao, setAcao] = useState<Status | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);
  const [, iniciar] = useTransition();

  function aplicar(novo: Status) {
    setAcao(novo);
    setMensagem(null);
    iniciar(async () => {
      const r = await revisarPagamento(id, novo, motivo);
      setAcao(null);
      if (r.erro) {
        setMensagem({ tipo: "erro", texto: r.erro });
        return;
      }
      setRecusando(false);
      setMensagem({ tipo: "sucesso", texto: r.sucesso ?? "" });
      navigator.vibrate?.(30);
      if (novo !== "em_analise" && status === "em_analise") router.push("/admin");
      else router.refresh();
    });
  }

  const ocupado = acao !== null;
  const icone = (alvo: Status, Icone: typeof Check) =>
    acao === alvo ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Icone className="size-4" aria-hidden />;

  return (
    <div className="space-y-3">
      {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}

      {recusando ? (
        <>
          <Campo rotulo="Motivo (o membro verá esta mensagem)">
            <AreaTexto
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              maxLength={500}
              placeholder="Ex.: comprovante ilegível, valor diferente, pagamento não encontrado no extrato…"
              autoFocus
            />
          </Campo>
          <div className="grid grid-cols-2 gap-2">
            <Botao variante="secundario" onClick={() => setRecusando(false)} disabled={ocupado}>
              Voltar
            </Botao>
            <Botao variante="perigo" onClick={() => aplicar("nao_pago")} disabled={ocupado || !motivo.trim()}>
              {icone("nao_pago", X)} Confirmar
            </Botao>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {status !== "pago" && (
            <Botao onClick={() => aplicar("pago")} disabled={ocupado} className={status === "nao_pago" ? "col-span-2" : ""}>
              {icone("pago", Check)} Pago
            </Botao>
          )}
          {status !== "nao_pago" && (
            <Botao
              variante="secundario"
              onClick={() => setRecusando(true)}
              disabled={ocupado}
              className={status === "pago" ? "col-span-2 text-red-600 dark:text-red-400" : "text-red-600 dark:text-red-400"}
            >
              <X className="size-4" aria-hidden /> Não pago
            </Botao>
          )}
          {status !== "em_analise" && (
            <Botao variante="fantasma" onClick={() => aplicar("em_analise")} disabled={ocupado} className="col-span-2">
              {icone("em_analise", RotateCcw)} Voltar para análise
            </Botao>
          )}
        </div>
      )}
    </div>
  );
}
