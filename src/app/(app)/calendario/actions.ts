"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin, exigirSessao } from "@/lib/auth";
import { data as formatarData, hojeISO } from "@/lib/format";
import { notificar } from "@/lib/push";

export type Resultado = { erro?: string; sucesso?: string };

const ehData = (valor: string) => /^\d{4}-\d{2}-\d{2}$/.test(valor);
const ehHora = (valor: string) => /^\d{2}:\d{2}$/.test(valor);

/** Cria (sem `id`) ou edita (com `id`) uma programação da agenda. Só a diretoria. */
export async function salvarEventoAgenda(_: Resultado, form: FormData): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const id = String(form.get("id") ?? "");
  const titulo = String(form.get("titulo") ?? "").trim();
  const data = String(form.get("data") ?? "");
  const hora = String(form.get("hora") ?? "");
  const local = String(form.get("local") ?? "").trim();
  const descricao = String(form.get("descricao") ?? "").trim();
  const avisar = form.get("avisar") === "on";

  if (titulo.length < 2) return { erro: "Informe o nome do evento." };
  if (!ehData(data)) return { erro: "Escolha a data do evento." };
  if (hora && !ehHora(hora)) return { erro: "Horário inválido." };

  const campos = {
    titulo: titulo.slice(0, 120),
    data,
    hora: hora || null,
    local: local.slice(0, 120) || null,
    descricao: descricao.slice(0, 1000) || null,
  };
  const { error } = id
    ? await supabase.from("agenda_eventos").update(campos).eq("id", id)
    : await supabase.from("agenda_eventos").insert(campos);
  if (error) return { erro: "Não foi possível salvar o evento." };

  if (!id && avisar) {
    const quando = [formatarData(data).slice(0, 5), hora, local].filter(Boolean).join(" · ");
    await notificar(
      { papel: "todos" },
      { title: `Nova programação: ${titulo}`, body: `${quando}. Confirme se você vai.`, url: `/calendario?data=${data}`, tag: `agenda-${data}` },
    );
  }

  revalidatePath("/calendario");
  return { sucesso: id ? "Evento atualizado." : "Evento adicionado ao calendário." };
}

export async function excluirEventoAgenda(id: string): Promise<Resultado> {
  const { supabase } = await exigirAdmin();
  const { error } = await supabase.from("agenda_eventos").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir o evento." };
  revalidatePath("/calendario");
  return { sucesso: "Evento excluído." };
}

/** Resposta do membro: vai (`true`), não vai (`false`) ou desfaz a resposta (`null`). */
export async function responderPresenca(eventoId: string, vai: boolean | null): Promise<Resultado> {
  const { supabase, perfil } = await exigirSessao();

  const { data: evento } = await supabase.from("agenda_eventos").select("data").eq("id", eventoId).maybeSingle();
  if (!evento) return { erro: "Evento não encontrado." };
  if (evento.data < hojeISO()) return { erro: "Este evento já aconteceu." };

  const { error } =
    vai === null
      ? await supabase.from("agenda_presencas").delete().eq("evento_id", eventoId).eq("membro_id", perfil.id)
      : await supabase
          .from("agenda_presencas")
          .upsert({ evento_id: eventoId, membro_id: perfil.id, vai, updated_at: new Date().toISOString() });
  if (error) return { erro: "Não foi possível salvar sua resposta." };

  revalidatePath("/calendario");
  return {};
}
