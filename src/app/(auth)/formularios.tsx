"use client";

import Link from "next/link";
import { useActionState, useId, useState, type ComponentProps } from "react";
import { Eye, EyeOff, Lock, Mail, Phone, UserRound, type LucideIcon } from "lucide-react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Aviso, BotaoLink, cx } from "@/components/ui";
import { cadastrar, definirSenha, entrar, recuperarSenha, type EstadoForm } from "./actions";
import { atributosTelefone } from "@/lib/telefone";

const inicial: EstadoForm = {};

/** Campo limpo: rótulo acima, ícone à esquerda e, em senhas, botão para mostrar/ocultar. */
function CampoLogin({
  rotulo,
  dica,
  icone: Icone,
  type,
  ...props
}: ComponentProps<"input"> & { rotulo: string; dica?: string; icone: LucideIcon }) {
  const id = useId();
  const senha = type === "password";
  const [visivel, setVisivel] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block pl-1 text-[13px] font-semibold text-texto/80">
        {rotulo}
      </label>
      <div className="group relative flex items-center rounded-2xl border border-borda bg-fundo transition focus-within:border-laranja-500 focus-within:bg-superficie focus-within:ring-2 focus-within:ring-laranja-500/35">
        <Icone
          aria-hidden
          className="pointer-events-none absolute left-4 size-[18px] text-suave transition group-focus-within:text-laranja-600"
        />
        <input
          id={id}
          type={senha && visivel ? "text" : type}
          className={cx(
            "h-12 w-full rounded-2xl bg-transparent pl-11 text-[15px] outline-none placeholder:text-suave focus-visible:outline-none",
            senha ? "pr-12" : "pr-4",
          )}
          {...props}
        />
        {senha && (
          <button
            type="button"
            onClick={() => setVisivel((v) => !v)}
            aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-2 grid size-9 place-items-center rounded-xl text-suave transition hover:bg-laranja-50 hover:text-texto dark:hover:bg-laranja-950"
          >
            {visivel ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {dica && <p className="pl-1 text-xs text-suave">{dica}</p>}
    </div>
  );
}

export function FormEntrar({ voltar, aviso }: { voltar: string; aviso?: string }) {
  const [estado, acao] = useActionState(entrar, inicial);
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="voltar" value={voltar} />
      {aviso && !estado.erro && <Aviso>{aviso}</Aviso>}
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <CampoLogin
        icone={Mail}
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="nome@email.com"
        required
      />
      <CampoLogin
        icone={Lock}
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        required
      />
      <div className="-mt-1 text-right">
        <Link
          href="/recuperar"
          className="inline-block py-2 text-sm font-medium text-azul-700 underline-offset-4 hover:underline dark:text-azul-300"
        >
          Esqueci minha senha
        </Link>
      </div>
      <BotaoEnviar className="w-full">Entrar</BotaoEnviar>
      <p className="text-center text-sm text-suave">
        Primeira vez aqui?{" "}
        <Link href="/cadastrar" className="font-semibold text-azul-700 underline-offset-4 hover:underline dark:text-azul-300">
          Criar conta
        </Link>
      </p>
    </form>
  );
}

export function FormCadastrar() {
  const [estado, acao] = useActionState(cadastrar, inicial);
  if (estado.sucesso) return <Aviso tipo="sucesso">{estado.sucesso}</Aviso>;
  return (
    <form action={acao} className="space-y-3.5">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <CampoLogin
        icone={UserRound}
        rotulo="Nome completo"
        name="nome"
        autoComplete="name"
        placeholder="Seu nome e sobrenome"
        required
        minLength={2}
      />
      <CampoLogin
        icone={Phone}
        rotulo="Celular (WhatsApp) · opcional"
        name="telefone"
        {...atributosTelefone}
      />
      <CampoLogin
        icone={Mail}
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="nome@email.com"
        required
      />
      <CampoLogin
        icone={Lock}
        rotulo="Senha"
        dica="Mínimo de 8 caracteres"
        name="senha"
        type="password"
        autoComplete="new-password"
        placeholder="Crie uma senha"
        required
        minLength={8}
      />
      <BotaoEnviar className="w-full">Criar conta</BotaoEnviar>
      <p className="text-center text-sm text-suave">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-azul-700 underline-offset-4 hover:underline dark:text-azul-300">
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
        <CampoLogin
          icone={Mail}
          rotulo="E-mail da sua conta"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nome@email.com"
          required
        />
      )}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {!estado.sucesso && (
          <BotaoEnviar className="px-3">
            Enviar link
          </BotaoEnviar>
        )}
        <BotaoLink href="/entrar" variante="secundario" className={estado.sucesso ? "col-span-2" : "px-3"}>
          Voltar
        </BotaoLink>
      </div>
    </form>
  );
}

export function FormNovaSenha() {
  const [estado, acao] = useActionState(definirSenha, inicial);
  return (
    <form action={acao} className="space-y-4">
      {estado.erro && <Aviso>{estado.erro}</Aviso>}
      <CampoLogin
        icone={Lock}
        rotulo="Nova senha"
        dica="Mínimo de 8 caracteres"
        name="senha"
        type="password"
        autoComplete="new-password"
        placeholder="Crie uma senha"
        required
        minLength={8}
      />
      <CampoLogin
        icone={Lock}
        rotulo="Confirme a nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        placeholder="Repita a senha"
        required
        minLength={8}
      />
      <BotaoEnviar className="mt-2 w-full">
        Salvar senha
      </BotaoEnviar>
    </form>
  );
}
