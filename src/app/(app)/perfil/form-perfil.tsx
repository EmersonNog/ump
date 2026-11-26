"use client";

import { useActionState } from "react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Aviso, Campo, Entrada } from "@/components/ui";
import { atualizarPerfil } from "../actions";

export function FormPerfil({ nome, telefone }: { nome: string; telefone: string }) {
  const [estado, acao] = useActionState(atualizarPerfil, {});
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso && <Aviso tipo="sucesso">{estado.sucesso}</Aviso>}
      <Campo rotulo="Nome completo">
        <Entrada name="nome" defaultValue={nome} autoComplete="name" required minLength={2} />
      </Campo>
      <Campo rotulo="Celular (WhatsApp)">
        <Entrada name="telefone" type="tel" defaultValue={telefone} autoComplete="tel" inputMode="tel" />
      </Campo>
      <BotaoEnviar variante="secundario">Salvar</BotaoEnviar>
    </form>
  );
}
