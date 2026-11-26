import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, FileText, MessageCircle } from "lucide-react";
import { Cartao, Selo } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { data, dataHoraCurta, moeda } from "@/lib/format";
import { Revisao } from "./revisao";

export const metadata: Metadata = { title: "Conferir comprovante" };

export default async function PaginaPagamento({ params }: PageProps<"/admin/pagamentos/[id]">) {
  const { id } = await params;
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
  const whatsapp = p.membro?.telefone?.replace(/\D/g, "");

  return (
    <>
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-suave hover:text-texto">
        <ArrowLeft className="size-4" aria-hidden /> Comprovantes
      </Link>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="lg:order-2">
          <Cartao className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{p.membro?.nome ?? "Membro removido"}</p>
                <p className="truncate text-sm text-suave">{p.membro?.email}</p>
              </div>
              <Selo situacao={p.status} />
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="col-span-2">
                <dt className="text-suave">Cobrança</dt>
                <dd className="font-medium">{p.cobranca ? tituloCobranca(p.cobranca) : "—"}</dd>
              </div>
              <div>
                <dt className="text-suave">Valor informado</dt>
                <dd className="font-serif text-xl font-semibold">{moeda(p.valor)}</dd>
              </div>
              <div>
                <dt className="text-suave">Valor da cobrança</dt>
                <dd className="font-serif text-xl font-semibold">{p.cobranca ? moeda(p.cobranca.valor) : "—"}</dd>
              </div>
              <div>
                <dt className="text-suave">Data do pagamento</dt>
                <dd className="font-medium">{data(p.data_pagamento)}</dd>
              </div>
              <div>
                <dt className="text-suave">Enviado em</dt>
                <dd className="font-medium">{dataHoraCurta(p.created_at)}</dd>
              </div>
            </dl>

            {divergente && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="size-4 shrink-0" aria-hidden /> Valor diferente do cobrado.
              </p>
            )}
            {p.observacao && (
              <p className="rounded-lg bg-fundo px-3 py-2 text-sm">
                <span className="text-suave">Observação do membro: </span>
                {p.observacao}
              </p>
            )}
            {p.revisado_em && (
              <p className="text-xs text-suave">
                Conferido por {p.revisor?.nome ?? "—"} em {dataHoraCurta(p.revisado_em)}
                {p.motivo && ` · Motivo: ${p.motivo}`}
              </p>
            )}

            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.length <= 11 ? `55${whatsapp}` : whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300"
              >
                <MessageCircle className="size-4" aria-hidden /> Falar no WhatsApp
              </a>
            )}

            <div className="border-t border-borda pt-4">
              <Revisao id={p.id} status={p.status} motivoAtual={p.motivo ?? ""} />
            </div>
          </Cartao>
        </div>

        <Cartao className="order-first overflow-hidden p-0 lg:order-1">
          {!link?.signedUrl ? (
            <p className="p-6 text-center text-sm text-suave">Arquivo do comprovante não encontrado.</p>
          ) : pdf ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <FileText className="size-12 text-brand-500" aria-hidden />
              <p className="font-semibold">Comprovante em PDF</p>
              <a
                href={link.signedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white"
              >
                Abrir PDF <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          ) : (
            <a href={link.signedUrl} target="_blank" rel="noreferrer" className="block bg-black/5 dark:bg-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.signedUrl}
                alt="Comprovante enviado"
                className="mx-auto max-h-[60dvh] w-auto object-contain lg:max-h-[80dvh]"
              />
            </a>
          )}
        </Cartao>
      </div>
    </>
  );
}
