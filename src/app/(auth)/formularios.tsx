"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Aviso, Campo, Entrada } from "@/components/ui";
import { cadastrar, definirSenha, entrar, recuperarSenha, type EstadoForm } from "./actions";

const inicial: EstadoForm = {};

export function FormEntrar({ voltar, aviso }: { voltar: string; aviso?: string }) {
  const [estado, acao] = useActionState(entrar, inicial);
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar} />
      {aviso && !estado.erro && <Aviso>{aviso}</Aviso>}
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <Campo rotulo="E-mail">
        <Entrada name="email" type="email" autoComplete="email" inputMode="email" required />
      </Campo>
      <Campo rotulo="Senha">
        <Entrada name="senha" type="password" autoComplete="current-password" required />
      </Campo>
      <div className="text-right">
        <Link href="/recuperar" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300">
          Esqueci minha senha
        </Link>
      </div>
      <BotaoEnviar className="w-full">Entrar</BotaoEnviar>
      <p className="pt-2 text-center text-sm text-suave">
        Ainda não tem conta?{" "}
        <Link href="/cadastrar" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}

export function FormCadastrar() {
  const [estado, acao] = useActionState(cadastrar, inicial);
  if (estado.sucesso) return <Aviso tipo="sucesso">{estado.sucesso}</Aviso>;
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <Campo rotulo="Nome completo">
        <Entrada name="nome" autoComplete="name" required minLength={2} />
      </Campo>
      <Campo rotulo="Celular (WhatsApp)" dica="Opcional">
        <Entrada name="telefone" type="tel" autoComplete="tel" inputMode="tel" placeholder="(00) 00000-0000" />
      </Campo>
      <Campo rotulo="E-mail">
        <Entrada name="email" type="email" autoComplete="email" inputMode="email" required />
      </Campo>
      <Campo rotulo="Senha" dica="Mínimo de 8 caracteres">
        <Entrada name="senha" type="password" autoComplete="new-password" required minLength={8} />
      </Campo>
      <BotaoEnviar className="w-full">Criar conta</BotaoEnviar>
      <p className="pt-2 text-center text-sm text-suave">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Entrar
        </Link>
      </p>
    </form>
  );
}

export function FormRecuperar() {
  const [estado, acao] = useActionState(recuperarSenha, inicial);
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      {estado.sucesso ? (
        <Aviso tipo="sucesso">{estado.sucesso}</Aviso>
      ) : (
        <>
          <Campo rotulo="E-mail da sua conta">
            <Entrada name="email" type="email" autoComplete="email" inputMode="email" required />
          </Campo>
          <BotaoEnviar className="w-full">Enviar link</BotaoEnviar>
        </>
      )}
      <p className="pt-2 text-center text-sm">
        <Link href="/entrar" className="font-semibold text-brand-600 hover:underline dark:text-brand-300">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}

export function FormNovaSenha() {
  const [estado, acao] = useActionState(definirSenha, inicial);
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <Campo rotulo="Nova senha" dica="Mínimo de 8 caracteres">
        <Entrada name="senha" type="password" autoComplete="new-password" required minLength={8} />
      </Campo>
      <Campo rotulo="Confirme a nova senha">
        <Entrada name="confirmacao" type="password" autoComplete="new-password" required minLength={8} />
      </Campo>
      <BotaoEnviar className="w-full">Salvar senha</BotaoEnviar>
    </form>
  );
}
