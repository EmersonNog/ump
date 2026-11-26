import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CopiarPix } from "@/components/copiar-pix";
import { Aviso, Cartao, Selo } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { situacaoPorCobranca, tituloCobranca } from "@/lib/cobrancas";
import { data, hojeISO, moeda } from "@/lib/format";
import { FormComprovante } from "./form-comprovante";

export const metadata: Metadata = { title: "Informar pagamento" };

export default async function PaginaPagar({ params }: PageProps<"/pagar/[id]">) {
  const { id } = await params;
  const { supabase, perfil } = await exigirSessao();

  const [{ data: cobranca }, { data: pagamentos }, { data: config }] = await Promise.all([
    supabase.from("cobrancas").select("*").eq("id", id).eq("ativa", true).maybeSingle(),
    supabase.from("pagamentos").select("*").eq("cobranca_id", id).eq("membro_id", perfil.id),
    supabase.from("configuracoes").select("chave_pix, favorecido").single(),
  ]);
  if (!cobranca) notFound();

  const [{ situacao, pagamento }] = situacaoPorCobranca([cobranca], pagamentos ?? []);
  if (situacao === "pago" || situacao === "em_analise") redirect("/historico");

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-suave hover:text-texto">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </Link>

      <Cartao className="mb-5 bg-gradient-to-br from-brand-50 to-superficie dark:from-brand-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-300">
              {cobranca.tipo === "evento" ? "Evento" : "Mensalidade"}
            </p>
            <h1 className="mt-0.5 font-serif text-xl font-semibold">{tituloCobranca(cobranca)}</h1>
            {cobranca.descricao && <p className="mt-1 text-sm text-suave">{cobranca.descricao}</p>}
          </div>
          <Selo situacao={situacao} />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <p className="font-serif text-3xl font-semibold">{moeda(cobranca.valor)}</p>
          {cobranca.vencimento && <p className="text-sm text-suave">Vence em {data(cobranca.vencimento)}</p>}
        </div>
      </Cartao>

      {situacao === "nao_pago" && (
        <div className="mb-5">
          <Aviso>
            Seu envio anterior não foi aprovado{pagamento?.motivo ? `: ${pagamento.motivo}` : "."} Envie um novo
            comprovante.
          </Aviso>
        </div>
      )}

      {config?.chave_pix && (
        <Cartao className="mb-5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-suave">1. Pague via PIX{config.favorecido ? ` para ${config.favorecido}` : ""}</p>
            <p data-selecionavel className="truncate font-mono text-sm font-semibold">
              {config.chave_pix}
            </p>
          </div>
          <CopiarPix chave={config.chave_pix} />
        </Cartao>
      )}

      <h2 className="mb-3 font-serif text-lg font-semibold">
        {config?.chave_pix ? "2. " : ""}Envie o comprovante
      </h2>
      <FormComprovante
        cobrancaId={cobranca.id}
        membroId={perfil.id}
        valorSugerido={Number(cobranca.valor).toFixed(2).replace(".", ",")}
        hoje={hojeISO()}
      />
    </div>
  );
}
