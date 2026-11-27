import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, MessageCircle } from "lucide-react";
import { Aviso, BotaoLink, Cartao, Selo, cx } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { data, dataHoraCurta, moeda } from "@/lib/format";
import { Revisao } from "./revisao";
import { numeroWhatsApp } from "@/lib/telefone";

export const metadata: Metadata = { title: "Conferir comprovante" };

const FEITO = { pago: "Pagamento confirmado.", nao_pago: "Marcado como não pago." } as const;

export default async function PaginaPagamento({ params, searchParams }: PageProps<"/admin/pagamentos/[id]">) {
  const { id } = await params;
  const { feito } = await searchParams;
  const { supabase } = await exigirAdmin();

  const { data: p } = await supabase
    .from("pagamentos")
    .select(
      "*, membro:profiles!pagamentos_membro_id_fkey(nome, email, telefone), revisor:profiles!pagamentos_revisado_por_fkey(nome), cobranca:cobrancas(tipo, titulo, competencia, valor)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();

  const { data: link } = await supabase.storage.from("comprovantes").createSignedUrl(p.comprovante_path, 60 * 30);
  const pdf = p.comprovante_path.toLowerCase().endsWith(".pdf");
  const divergente = p.cobranca && Number(p.valor) !== Number(p.cobranca.valor);
  const telefone = p.membro?.telefone;

  return (
    <>
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-suave transition hover:text-texto">
        <ArrowLeft className="size-4" aria-hidden /> Comprovantes
      </Link>
      {(feito === "pago" || feito === "nao_pago") && (
        <div className="mb-6">
          <Aviso tipo="sucesso">{FEITO[feito]} Este é o próximo comprovante em análise.</Aviso>
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
        <Cartao className="overflow-hidden p-0 lg:self-start">
          {!link?.signedUrl ? (
            <p className="p-6 text-center text-sm text-suave">Arquivo do comprovante não encontrado.</p>
          ) : pdf ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <FileText className="size-8 text-suave" aria-hidden />
              <p className="font-medium">Comprovante em PDF</p>
              <BotaoLink href={link.signedUrl} target="_blank" rel="noreferrer" variante="secundario">
                Abrir PDF <ExternalLink className="size-4" aria-hidden />
              </BotaoLink>
            </div>
          ) : (
            <a href={link.signedUrl} target="_blank" rel="noreferrer" className="block bg-fundo" title="Abrir em nova aba">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.signedUrl}
                alt="Comprovante enviado"
                className="mx-auto max-h-[60dvh] w-auto object-contain lg:max-h-[80dvh]"
              />
            </a>
          )}
        </Cartao>

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold tracking-tight break-words">{p.membro?.nome ?? "Membro removido"}</h1>
              {p.membro?.email && <p className="truncate text-sm text-suave">{p.membro.email}</p>}
              {telefone && (
                <a
                  href={`https://wa.me/${numeroWhatsApp(telefone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-suave tabular-nums underline-offset-4 transition hover:text-texto hover:underline"
                >
                  <MessageCircle className="size-3.5" aria-hidden /> {telefone} · Falar no WhatsApp
                </a>
              )}
            </div>
            <Selo situacao={p.status} className="mt-1" />
          </div>

          <dl className="mt-6 divide-y divide-borda border-y border-borda text-sm">
            <div className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-suave">Cobrança</dt>
              <dd className="min-w-0 text-right font-medium break-words">{p.cobranca ? tituloCobranca(p.cobranca) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-suave">Valor informado</dt>
              <dd
                className={cx(
                  "inline-flex items-center gap-1 font-medium tabular-nums",
                  divergente && "text-amber-700 dark:text-amber-300",
                )}
              >
                {divergente && <AlertTriangle className="size-3.5" aria-hidden />}
                {moeda(p.valor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-suave">Valor da cobrança</dt>
              <dd className="font-medium tabular-nums">{p.cobranca ? moeda(p.cobranca.valor) : "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-suave">Data do pagamento</dt>
              <dd className="font-medium tabular-nums">{data(p.data_pagamento)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="shrink-0 text-suave">Enviado em</dt>
              <dd className="font-medium tabular-nums">{dataHoraCurta(p.created_at)}</dd>
            </div>
            {p.observacao && (
              <div className="py-3">
                <dt className="text-suave">Observação do membro</dt>
                <dd className="mt-1 break-words">{p.observacao}</dd>
              </div>
            )}
          </dl>

          {divergente && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0" aria-hidden /> Valor diferente do cobrado.
            </p>
          )}
          {p.revisado_em && (
            <p className="mt-3 text-xs text-suave break-words">
              Conferido por {p.revisor?.nome ?? "—"} em {dataHoraCurta(p.revisado_em)}
              {p.motivo && ` · Motivo: ${p.motivo}`}
            </p>
          )}

          {/* No celular, as decisões ficam presas acima da barra de navegação, ao alcance do polegar. */}
          <div className="mt-6 max-md:fixed max-md:inset-x-0 max-md:bottom-[calc(4rem+env(safe-area-inset-bottom))] max-md:z-20 max-md:mt-0 max-md:border-t max-md:border-borda max-md:bg-superficie/95 max-md:p-4 max-md:backdrop-blur-xl">
            <Revisao id={p.id} status={p.status} motivoAtual={p.motivo ?? ""} />
          </div>
          <div aria-hidden className="h-36 md:hidden" />
        </div>
      </div>
    </>
  );
}
