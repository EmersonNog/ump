import type { Metadata } from "next";
import { Calendario, type ItemCalendario } from "@/components/calendario";
import { Titulo } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { itensDoMembro, tituloCobranca } from "@/lib/cobrancas";
import { hojeISO } from "@/lib/format";

export const metadata: Metadata = { title: "Calendário" };

export default async function PaginaCalendario() {
  const { supabase, perfil } = await exigirSessao();
  const [{ data: cobrancas }, { data: pagamentos }] = await Promise.all([
    supabase.from("cobrancas").select("*").eq("ativa", true),
    supabase.from("pagamentos").select("*").eq("membro_id", perfil.id),
  ]);

  const itens: ItemCalendario[] = itensDoMembro(cobrancas ?? [], pagamentos ?? [], perfil.created_at).flatMap(
    ({ cobranca, pagamento, situacao }) =>
      cobranca.vencimento
        ? [
            {
              id: cobranca.id,
              titulo: tituloCobranca(cobranca),
              tipo: cobranca.tipo,
              valor: Number(cobranca.valor),
              vencimento: cobranca.vencimento,
              situacao,
              motivo: pagamento?.motivo ?? null,
            },
          ]
        : [],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Titulo subtitulo="Vencimentos das mensalidades e dos eventos.">Calendário</Titulo>
      <Calendario itens={itens} hojeInicial={hojeISO()} />
    </div>
  );
}
