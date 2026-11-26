import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type Perfil = Database["public"]["Tables"]["profiles"]["Row"];

/** Usuário logado + perfil. Memorizado por requisição. */
export const obterSessao = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const usuarioId = claimsData?.claims.sub;
  if (!usuarioId) return null;

  const { data: perfil } = await supabase.from("profiles").select("*").eq("id", usuarioId).single();
  if (!perfil) return null;

  return { supabase, perfil: perfil satisfies Perfil };
});

export async function exigirSessao() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/entrar");
  return sessao;
}

export async function exigirAdmin() {
  const sessao = await exigirSessao();
  if (sessao.perfil.papel !== "admin") redirect("/");
  return sessao;
}
