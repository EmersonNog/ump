"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirAdmin } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { lerValor, moeda } from "@/lib/format";
import { notificar } from "@/lib/push";
import { lerPixCopiaECola } from "@/lib/pix";

export type Resultado = { erro?: string; sucesso?: string };

type Status = "em_analise" | "pago" | "nao_pago";

export async function revisarPagamento(id: string, status: Status, motivo: string): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const motivoLimpo = motivo.trim().slice(0, 500);
  if (status === "nao_pago" && !motivoLimpo) return { erro: "Informe o motivo para o membro entender o que corrigir." };

  const { data: pagamento, error } = await supabase
    .from("pagamentos")
    .update({ status, motivo: status === "nao_pago" ? motivoLimpo : null })
    .eq("id", id)
    .select("membro_id, valor, cobranca:cobrancas(tipo, titulo, competencia)")
    .single();

  if (error) {
    return {
      erro:
        error.code === "23505"
          ? "Este membro já tem outro envio válido para esta cobrança."
          : "Não foi possível atualizar o status.",
    };
  }

  if (status !== "em_analise" && pagamento.cobranca) {
    const titulo = tituloCobranca(pagamento.cobranca);
    await notificar(
      { usuarios: [pagamento.membro_id] },
      status === "pago"
        ? { title: "Pagamento confirmado ✅", body: `${titulo} · ${moeda(pagamento.valor)}`, url: "/historico", tag: `pg-${id}` }
        : { title: "Pagamento não aprovado", body: `${titulo}: ${motivoLimpo}`, url: "/", tag: `pg-${id}` },
    );
  }

  revalidatePath("/", "layout");
  return { sucesso: status === "pago" ? "Pagamento confirmado." : status === "nao_pago" ? "Marcado como não pago." : "Voltou para análise." };
}

export async function criarEvento(_: Resultado, form: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const titulo = String(form.get("titulo") ?? "").trim();
  const descricao = String(form.get("descricao") ?? "").trim();
  const valor = lerValor(String(form.get("valor") ?? ""));
  const vencimento = String(form.get("vencimento") ?? "") || null;
  const avisar = form.get("avisar") === "on";

  if (titulo.length < 2) return { erro: "Informe o nome do evento." };
  if (!valor) return { erro: "Informe um valor válido." };

  const { error } = await supabase
    .from("cobrancas")
    .insert({ tipo: "evento", titulo, descricao: descricao || null, valor, vencimento });
  if (error) return { erro: "Não foi possível criar o evento." };

  if (avisar) {
    await notificar({ papel: "todos" }, { title: "Nova cobrança: " + titulo, body: `Valor: ${moeda(valor)}`, url: "/", tag: "nova-cobranca" });
  }

  revalidatePath("/", "layout");
  return { sucesso: `Evento “${titulo}” criado.` };
}

export async function gerarMensalidades(_: Resultado, form: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const ano = Number(form.get("ano"));
  const valor = lerValor(String(form.get("valor") ?? ""));
  const dia = Number(form.get("dia") || 10);
  const avisar = form.get("avisar") === "on";

  if (!Number.isInteger(ano) || ano < 2020 || ano > 2100) return { erro: "Ano inválido." };
  if (!valor) return { erro: "Informe um valor válido." };
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) return { erro: "O dia de vencimento deve ser entre 1 e 28." };

  const { data: existentes } = await supabase
    .from("cobrancas")
    .select("competencia")
    .eq("tipo", "mensalidade")
    .gte("competencia", `${ano}-01-01`)
    .lte("competencia", `${ano}-12-01`);
  const jaCriadas = new Set((existentes ?? []).map((c) => c.competencia));

  const novas = Array.from({ length: 12 }, (_, i) => {
    const mes = String(i + 1).padStart(2, "0");
    return {
      tipo: "mensalidade" as const,
      titulo: `Mensalidade ${mes}/${ano}`,
      valor,
      competencia: `${ano}-${mes}-01`,
      vencimento: `${ano}-${mes}-${String(dia).padStart(2, "0")}`,
    };
  }).filter((c) => !jaCriadas.has(c.competencia));

  if (novas.length === 0) return { erro: `As mensalidades de ${ano} já existem.` };

  const { error } = await supabase.from("cobrancas").insert(novas);
  if (error) return { erro: "Não foi possível gerar as mensalidades." };

  if (avisar) {
    await notificar(
      { papel: "todos" },
      { title: `Mensalidades de ${ano}`, body: `Já disponíveis no app · ${moeda(valor)}/mês`, url: "/", tag: "nova-cobranca" },
    );
  }

  revalidatePath("/", "layout");
  return { sucesso: `${novas.length} mensalidade(s) de ${ano} criada(s).` };
}

export async function alternarCobranca(id: string, ativa: boolean): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("cobrancas").update({ ativa }).eq("id", id);
  if (error) return { erro: "Não foi possível atualizar a cobrança." };
  revalidatePath("/", "layout");
  return { sucesso: ativa ? "Cobrança reativada." : "Cobrança encerrada." };
}

export async function excluirCobranca(id: string): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const { count } = await supabase
    .from("pagamentos")
    .select("id", { count: "exact", head: true })
    .eq("cobranca_id", id);
  if (count) return { erro: "Esta cobrança já tem pagamentos. Encerre-a em vez de excluir." };

  const { error } = await supabase.from("cobrancas").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir." };
  revalidatePath("/", "layout");
  redirect("/admin/cobrancas");
}

export async function atualizarMembro(
  id: string,
  mudanca: { papel?: "membro" | "admin"; ativo?: boolean },
): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("profiles").update(mudanca).eq("id", id);
  if (error) {
    return { erro: error.message.includes("pelo menos um administrador") ? "O sistema precisa de pelo menos um administrador." : "Não foi possível atualizar o membro." };
  }
  revalidatePath("/admin/membros");
  return { sucesso: "Membro atualizado." };
}

export async function salvarConfiguracoes(_: Resultado, form: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const campo = (nome: string) => String(form.get(nome) ?? "").trim() || null;

  // Aceita o código colado com quebras de linha ou espaços nas pontas.
  const copiaECola = campo("pix_copia_cola")?.replace(/[\r\n]/g, "") ?? null;
  const dadosPix = copiaECola ? lerPixCopiaECola(copiaECola) : null;
  if (copiaECola && !dadosPix) {
    return { erro: "Código Pix copia e cola inválido. Copie novamente do app do banco, sem alterar nada." };
  }

  const { error } = await supabase
    .from("configuracoes")
    .update({
      pix_copia_cola: copiaECola,
      // Sem chave/favorecido informados, usa os que estão dentro do código Pix.
      chave_pix: campo("chave_pix") ?? dadosPix?.chave ?? null,
      favorecido: campo("favorecido") ?? dadosPix?.nome ?? null,
      instrucoes: campo("instrucoes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { erro: "Não foi possível salvar." };

  revalidatePath("/", "layout");
  return { sucesso: "Dados de pagamento salvos." };
}
