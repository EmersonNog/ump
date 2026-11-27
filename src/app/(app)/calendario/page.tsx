import type { Metadata } from "next";
import { Calendario, type EventoAgenda } from "./calendario";
import { Titulo } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { hojeISO } from "@/lib/format";

export const metadata: Metadata = { title: "Calendário" };

export default async function PaginaCalendario({ searchParams }: PageProps<"/calendario">) {
  const { data: dataParam } = await searchParams;
  const { supabase, perfil } = await exigirSessao();
  const admin = perfil.papel === "admin";

  const [{ data: eventos }, { data: presencas }, { data: perfis }] = await Promise.all([
    supabase.from("agenda_eventos").select("*").order("data").order("hora", { nullsFirst: true }),
    supabase.from("agenda_presencas").select("evento_id, membro_id, vai"),
    // Nomes de quem respondeu: só a diretoria lê os perfis dos outros membros.
    admin ? supabase.from("profiles").select("id, nome").order("nome") : Promise.resolve({ data: [] as { id: string; nome: string }[] }),
  ]);

  const nomes = new Map((perfis ?? []).map((p) => [p.id, p.nome]));
  const lista: EventoAgenda[] = (eventos ?? []).map((e) => {
    const respostas = (presencas ?? []).filter((p) => p.evento_id === e.id);
    const vao = respostas.filter((p) => p.vai);
    const naoVao = respostas.filter((p) => !p.vai);
    const minha = respostas.find((p) => p.membro_id === perfil.id);
    const nomesDe = (r: typeof respostas) => r.map((p) => nomes.get(p.membro_id) ?? "Membro").sort((a, b) => a.localeCompare(b));
    return {
      id: e.id,
      titulo: e.titulo,
      data: e.data,
      hora: e.hora?.slice(0, 5) ?? null,
      local: e.local,
      descricao: e.descricao,
      minhaResposta: minha ? minha.vai : null,
      vao: vao.length,
      naoVao: naoVao.length,
      ...(admin ? { nomesVao: nomesDe(vao), nomesNaoVao: nomesDe(naoVao) } : {}),
    };
  });

  const dataInicial = typeof dataParam === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dataParam) ? dataParam : null;

  return (
    <div className="mx-auto max-w-4xl">
      <Titulo subtitulo={admin ? "Toque num dia para ver ou adicionar programações." : "Toque num dia para ver a programação e confirmar se você vai."}>
        Calendário
      </Titulo>
      <Calendario eventos={lista} hojeInicial={hojeISO()} dataInicial={dataInicial} admin={admin} />
    </div>
  );
}
