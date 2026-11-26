"use client";

import { useActionState } from "react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { AreaTexto, Aviso, Campo, Entrada } from "@/components/ui";
import { salvarConfiguracoes } from "../actions";

export function FormConfiguracoes({
  chavePix,
  favorecido,
  instrucoes,
}: {
  chavePix: string;
  favorecido: string;
  instrucoes: string;
}) {
  const [estado, acao] = useActionState(salvarConfiguracoes, {});
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}
      <Campo rotulo="Chave PIX" dica="CPF, CNPJ, e-mail, celular ou chave aleatória">
        <Entrada name="chave_pix" defaultValue={chavePix} maxLength={140} />
      </Campo>
      <Campo rotulo="Favorecido" dica="Nome que aparece no app do banco ao pagar">
        <Entrada name="favorecido" defaultValue={favorecido} maxLength={120} />
      </Campo>
      <Campo rotulo="Instruções" dica="Opcional. Ex.: Envie o comprovante logo após pagar.">
        <AreaTexto name="instrucoes" defaultValue={instrucoes} maxLength={1000} />
      </Campo>
      <BotaoEnviar>Salvar</BotaoEnviar>
    </form>
  );
}
