"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoForm = { erro?: string; sucesso?: string };

const MENSAGENS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail antes de entrar (veja sua caixa de entrada).",
  user_already_exists: "Já existe uma conta com este e-mail.",
  email_exists: "Já existe uma conta com este e-mail.",
  weak_password: "Senha muito fraca. Use pelo menos 8 caracteres.",
  over_email_send_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  over_request_rate_limit: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  same_password: "A nova senha precisa ser diferente da atual.",
};

function traduzir(erro: { code?: string; message: string }) {
  return (erro.code && MENSAGENS[erro.code]) || "Não foi possível concluir. Tente novamente.";
}

function texto(form: FormData, campo: string) {
  return String(form.get(campo) ?? "").trim();
}

/** Aceita só caminhos internos, evitando redirecionamento aberto. */
function destinoSeguro(valor: string) {
  return valor.startsWith("/") && !valor.startsWith("//") && !valor.startsWith("/\\") ? valor : "/";
}

async function origem() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = texto(form, "email");
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: traduzir(error) };

  redirect(destinoSeguro(texto(form, "voltar")));
}

export async function cadastrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const nome = texto(form, "nome");
  const telefone = texto(form, "telefone");
  const email = texto(form, "email");
  const senha = String(form.get("senha") ?? "");

  if (nome.length < 2) return { erro: "Informe seu nome completo." };
  if (!email.includes("@")) return { erro: "Informe um e-mail válido." };
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, telefone }, emailRedirectTo: `${await origem()}/auth/callback` },
  });
  if (error) return { erro: traduzir(error) };

  // Confirmação de e-mail desativada: já entra direto.
  if (data.session) redirect("/");
  return { sucesso: "Conta criada! Enviamos um link de confirmação para o seu e-mail." };
}

export async function recuperarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const email = texto(form, "email");
  if (!email.includes("@")) return { erro: "Informe um e-mail válido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/callback?proximo=/nova-senha`,
  });
  if (error?.code?.startsWith("over_")) return { erro: traduzir(error) };

  // Mesma resposta exista ou não a conta, para não expor e-mails cadastrados.
  return { sucesso: "Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha." };
}

export async function definirSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const senha = String(form.get("senha") ?? "");
  if (senha.length < 8) return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  if (senha !== String(form.get("confirmacao") ?? "")) return { erro: "As senhas não conferem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: traduzir(error) };

  redirect("/?senha=alterada");
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/entrar");
}
