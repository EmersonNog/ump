"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { lerValor, moeda } from "@/lib/format";
import { notificar } from "@/lib/push";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizarTelefone } from "@/lib/telefone";

export type Resultado = { erro?: string; sucesso?: string };

type NovoPagamento = {
  cobrancaId: string;
  valor: string;
  dataPagamento: string;
  observacao: string;
  comprovantePath: string;
};

export async function registrarPagamento(dados: NovoPagamento): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();

  const valor = lerValor(dados.valor);
  if (!valor) return { erro: "Informe o valor pago." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.dataPagamento)) return { erro: "Informe a data do pagamento." };
  if (!dados.comprovantePath.startsWith(`${perfil.id}/`)) return { erro: "Comprovante inválido." };

  const { data: cobranca } = await supabase
    .from("cobrancas")
    .select("id, tipo, titulo, competencia, ativa")
    .eq("id", dados.cobrancaId)
    .single();
  if (!cobranca?.ativa) return { erro: "Esta cobrança não está mais disponível." };

  const { error } = await supabase.from("pagamentos").insert({
    cobranca_id: cobranca.id,
    membro_id: perfil.id,
    valor,
    data_pagamento: dados.dataPagamento,
    comprovante_path: dados.comprovantePath,
    observacao: dados.observacao.trim().slice(0, 500) || null,
  });

  if (error) {
    await supabase.storage.from("comprovantes").remove([dados.comprovantePath]);
    return {
      erro:
        error.code === "23505"
          ? "Você já enviou um comprovante para esta cobrança."
          : "Não foi possível registrar o pagamento. Tente novamente.",
    };
  }

  await notificar(
    { papel: "admin" },
    {
      title: "Novo comprovante",
      body: `${perfil.nome} · ${tituloCobranca(cobranca)} · ${moeda(valor)}`,
      url: "/admin",
      tag: "novo-comprovante",
    },
  );

  revalidatePath("/", "layout");
  return { sucesso: "ok" };
}

export async function cancelarPagamento(id: string): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();

  const { data: removido, error } = await supabase
    .from("pagamentos")
    .delete()
    .eq("id", id)
    .eq("membro_id", perfil.id)
    .eq("status", "em_analise")
    .select("comprovante_path")
    .maybeSingle();

  if (error || !removido) return { erro: "Só é possível cancelar envios que ainda estão em análise." };

  await supabase.storage.from("comprovantes").remove([removido.comprovante_path]);
  revalidatePath("/", "layout");
  return { sucesso: "Envio cancelado." };
}

export async function atualizarPerfil(_: Resultado, form: FormData): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();
  const nome = String(form.get("nome") ?? "").trim();
  const celular = normalizarTelefone(String(form.get("telefone") ?? ""));
  if (nome.length < 2) return { erro: "Informe seu nome completo." };
  if ("erro" in celular) return { erro: celular.erro };

  const { error } = await supabase
    .from("profiles")
    .update({ nome, telefone: celular.telefone })
    .eq("id", perfil.id);
  if (error) return { erro: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { sucesso: "Dados atualizados." };
}

type InscricaoPush = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function salvarInscricaoPush(inscricao: InscricaoPush): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();
  if (!inscricao.endpoint.startsWith("https://") || !inscricao.keys?.p256dh || !inscricao.keys?.auth) {
    return { erro: "Inscrição inválida." };
  }

  // O mesmo aparelho pode ter sido usado por outra conta antes (RLS só enxerga as próprias).
  await createServiceClient().from("push_subscriptions").delete().eq("endpoint", inscricao.endpoint);
  const { error } = await supabase.from("push_subscriptions").insert({
    user_id: perfil.id,
    endpoint: inscricao.endpoint,
    p256dh: inscricao.keys.p256dh,
    auth: inscricao.keys.auth,
  });
  if (error) return { erro: "Não foi possível ativar as notificações." };

  await notificar(
    { usuarios: [perfil.id] },
    { title: "Notificações ativadas 🔔", body: "Você será avisado sobre seus pagamentos.", url: "/perfil", tag: "teste" },
  );
  return { sucesso: "Notificações ativadas." };
}

export async function removerInscricaoPush(endpoint: string): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint).eq("user_id", perfil.id);
  return { sucesso: "Notificações desativadas." };
}
