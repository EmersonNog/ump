"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/auth";
import { lerValor } from "@/lib/format";

export type Resultado = { erro?: string; sucesso?: string };

const FORMAS = ["Pix", "Cartão", "Dinheiro", "Não informado"] as const;
const ORIGENS = ["Livro", "Relatório bancário", "App"] as const;
type Forma = (typeof FORMAS)[number];
type Origem = (typeof ORIGENS)[number];

/** Cria (sem `id`) ou edita (com `id`) um lançamento do livro. */
export async function salvarLancamento(_: Resultado, form: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const id = String(form.get("id") ?? "");
  const data = String(form.get("data") ?? "");
  const detalhes = String(form.get("detalhes") ?? "").trim();
  const valor = lerValor(String(form.get("valor") ?? ""));
  const saida = form.get("direcao") === "saida";
  const categoria = String(form.get("categoria") ?? "").trim() || "Sem categoria";
  const forma = String(form.get("forma") ?? "Não informado") as Forma;
  const origem = String(form.get("origem") ?? "Livro") as Origem;
  const socio = String(form.get("socio") ?? "") || null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return { erro: "Informe a data." };
  if (!detalhes) return { erro: "Descreva o lançamento." };
  if (!valor) return { erro: "Informe um valor válido." };
  if (!FORMAS.includes(forma) || !ORIGENS.includes(origem)) return { erro: "Forma ou origem inválida." };

  const campos = {
    data,
    detalhes: detalhes.slice(0, 300),
    valor: saida ? -valor : valor,
    categoria: categoria.slice(0, 60),
    forma,
    origem,
    socio_id: socio,
  };
  const { error } = id
    ? await supabase.from("lancamentos").update(campos).eq("id", id)
    : await supabase.from("lancamentos").insert(campos);
  if (error) return { erro: "Não foi possível salvar o lançamento." };

  revalidatePath("/admin/painel");
  return { sucesso: id ? "Lançamento atualizado." : "Lançamento adicionado." };
}

export async function excluirLancamento(id: string): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("lancamentos").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir." };
  revalidatePath("/admin/painel");
  return { sucesso: "Lançamento excluído." };
}
