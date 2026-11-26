"use client";

import { useActionState, useEffect, useRef } from "react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { AreaTexto, Aviso, Campo, Entrada } from "@/components/ui";
import { criarEvento, gerarMensalidades, type Resultado } from "../actions";

function Avisar() {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name="avisar" defaultChecked className="size-4 accent-brand-600" />
      Notificar os membros
    </label>
  );
}

/** Limpa o formulário após sucesso. */
function useLimparAoConcluir(estado: Resultado) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado.sucesso) ref.current?.reset();
  }, [estado]);
  return ref;
}

export function FormEvento() {
  const [estado, acao] = useActionState(criarEvento, {});
  const ref = useLimparAoConcluir(estado);
  return (
    <form ref={ref} action={acao} className="space-y-3">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}
      <Campo rotulo="Nome">
        <Entrada name="titulo" placeholder="Ex.: Acampamento de Carnaval" required />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor (R$)">
          <Entrada name="valor" inputMode="decimal" placeholder="150,00" required />
        </Campo>
        <Campo rotulo="Vencimento">
          <Entrada name="vencimento" type="date" />
        </Campo>
      </div>
      <Campo rotulo="Descrição" dica="Opcional">
        <AreaTexto name="descricao" maxLength={1000} placeholder="Local, data, o que inclui…" />
      </Campo>
      <Avisar />
      <BotaoEnviar className="w-full">Criar evento</BotaoEnviar>
    </form>
  );
}

export function FormMensalidades({ anoAtual }: { anoAtual: number }) {
  const [estado, acao] = useActionState(gerarMensalidades, {});
  return (
    <form action={acao} className="space-y-3">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}
      <div className="grid grid-cols-3 gap-3">
        <Campo rotulo="Ano">
          <Entrada name="ano" type="number" defaultValue={anoAtual} min={2020} max={2100} required />
        </Campo>
        <Campo rotulo="Valor (R$)">
          <Entrada name="valor" inputMode="decimal" placeholder="20,00" required />
        </Campo>
        <Campo rotulo="Dia venc.">
          <Entrada name="dia" type="number" defaultValue={10} min={1} max={28} required />
        </Campo>
      </div>
      <p className="text-xs text-suave">Cria as 12 mensalidades do ano (meses já existentes são mantidos).</p>
      <Avisar />
      <BotaoEnviar variante="secundario" className="w-full">
        Gerar mensalidades
      </BotaoEnviar>
    </form>
  );
}
