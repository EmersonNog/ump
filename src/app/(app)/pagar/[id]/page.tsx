import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, QrCode, ShieldCheck } from "lucide-react";
import { CopiarPix } from "@/components/copiar-pix";
import { QrPix } from "@/components/qr-pix";
import { Aviso, CabecalhoSecao, Selo, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { prazo, situacaoPorCobranca, tituloCobranca } from "@/lib/cobrancas";
import { hojeISO, moeda } from "@/lib/format";
import { pixComValor, pixUmp } from "@/lib/pix";
import { FormComprovante } from "./form-comprovante";

export const metadata: Metadata = { title: "Informar pagamento" };

export default async function PaginaPagar({ params }: PageProps<"/pagar/[id]">) {
  const { id } = await params;
  const { supabase, perfil } = await exigirSessao();

  const [{ data: cobranca }, { data: pagamentos }] = await Promise.all([
    supabase.from("cobrancas").select("*").eq("id", id).eq("ativa", true).maybeSingle(),
    supabase.from("pagamentos").select("*").eq("cobranca_id", id).eq("membro_id", perfil.id),
  ]);
  if (!cobranca) notFound();

  const [{ situacao, pagamento }] = situacaoPorCobranca([cobranca], pagamentos ?? []);
  if (situacao === "pago" || situacao === "em_analise") redirect("/historico");

  const codigoComValor = pixComValor(Number(cobranca.valor));
  const prazoCobranca = prazo(cobranca.vencimento, hojeISO(), true);
  const titular = pixUmp.favorecido.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-suave transition hover:text-texto">
        <ArrowLeft className="size-4" aria-hidden /> Voltar
      </Link>

      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">{tituloCobranca(cobranca)}</h1>
        {cobranca.descricao && <p className="mt-1 text-sm text-suave">{cobranca.descricao}</p>}
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <p className="font-display text-3xl font-extrabold tracking-tight tabular-nums">{moeda(cobranca.valor)}</p>
          <div className="flex items-center gap-3 text-sm">
            {prazoCobranca && (
              <span
                className={cx(
                  "tabular-nums",
                  prazoCobranca.vencida ? "font-medium text-red-700 dark:text-red-400" : "text-suave",
                )}
              >
                {prazoCobranca.texto}
              </span>
            )}
            <Selo situacao={situacao} />
          </div>
        </div>
      </header>

      {situacao === "nao_pago" && (
        <div className="mb-8">
          <Aviso>
            Seu envio anterior não foi aprovado{pagamento?.motivo ? `: ${pagamento.motivo}` : "."} Envie um novo
            comprovante.
          </Aviso>
        </div>
      )}

      <section className="mb-10">
        <CabecalhoSecao titulo="1. Pague com Pix" />
        <div className="flex flex-col gap-5 pt-5 sm:flex-row sm:items-center">
          <div className="space-y-3 sm:order-2 sm:flex-1">
            <p className="text-sm text-suave">
              Copie o código e cole na área Pix do app do seu banco. O valor de{" "}
              <span className="font-semibold text-texto tabular-nums">{moeda(cobranca.valor)}</span> já vem preenchido.
            </p>
            <CopiarPix texto={codigoComValor} rotulo="Copiar Pix copia e cola" descricao="Copiar Pix copia e cola" grande />
          </div>
          {/* QR só aberto no computador; no celular ele fica recolhido (ninguém escaneia a própria tela). */}
          <div className="hidden self-auto rounded-2xl border border-borda bg-white p-3 sm:order-1 sm:block">
            <QrPix codigo={codigoComValor} className="w-44 [&_svg]:h-auto [&_svg]:w-full" />
          </div>
          <details className="group sm:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-azul-700 dark:text-azul-300">
              <QrCode className="size-4" aria-hidden />
              Vai pagar por outro aparelho? Mostrar QR Code
            </summary>
            <div className="mt-3 inline-block rounded-2xl border border-borda bg-white p-3">
              <QrPix codigo={codigoComValor} className="w-48 [&_svg]:h-auto [&_svg]:w-full" />
            </div>
          </details>
        </div>

        {/* Quem recebe: o app do banco mostra o nome do titular, não "UMP Jóquei". */}
        <div className="mt-5 rounded-2xl bg-azul-50 p-4 text-sm dark:bg-azul-950/60">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-azul-700 dark:text-azul-300" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Conta da tesouraria da UMP Jóquei</p>
              <p className="mt-0.5 text-pretty text-suave">
                No app do banco vai aparecer o nome do titular: <span className="font-medium text-texto">{titular}</span>.
                Confira antes de confirmar.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <p className="min-w-0 flex-1">
                  <span className="block text-xs text-suave">Chave Pix</span>
                  <span data-selecionavel className="font-medium break-all tabular-nums">
                    {pixUmp.chave}
                  </span>
                </p>
                <CopiarPix texto={pixUmp.chave} rotulo="Copiar chave" descricao="Copiar chave Pix" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <CabecalhoSecao titulo="2. Envie o comprovante" className="mb-5" />
        <FormComprovante
          cobrancaId={cobranca.id}
          membroId={perfil.id}
          valorSugerido={Number(cobranca.valor).toFixed(2).replace(".", ",")}
          hoje={hojeISO()}
        />
      </section>
    </div>
  );
}
