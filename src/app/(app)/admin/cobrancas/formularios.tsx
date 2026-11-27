"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { BotaoEnviar } from "@/components/botao-enviar";
import { AreaTexto, Aviso, Campo, Entrada } from "@/components/ui";
import { criarEvento, gerarMensalidades, type Resultado } from "../actions";

/** Mensagem de sucesso com atalho de volta para a lista. */
function Sucesso({ texto }: { texto: string }) {
  return (
    <Aviso tipo="sucesso">
      {texto}{" "}
      <Link href="/admin/cobrancas" className="font-semibold underline underline-offset-4">
        Ver cobranças
      </Link>
    </Aviso>
  );
}

function Avisar() {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-texto/80 select-none">
      <input type="checkbox" name="avisar" defaultChecked className="size-4 shrink-0 accent-laranja-600" />
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
    <form ref={ref} action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso && <Sucesso texto={estado.sucesso} />}
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
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso && <Sucesso texto={estado.sucesso} />}
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
      <p className="text-xs text-suave">Meses que já existem nesse ano são mantidos como estão.</p>
      <Avisar />
      <BotaoEnviar className="w-full">Gerar mensalidades</BotaoEnviar>
    </form>
  );
}
