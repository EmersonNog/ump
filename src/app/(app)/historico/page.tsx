import type { Metadata } from "next";
import { ExternalLink, Receipt } from "lucide-react";
import { Cartao, Selo, Titulo, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { data, dataHoraCurta, moeda } from "@/lib/format";
import { BotaoCancelar } from "./botao-cancelar";

export const metadata: Metadata = { title: "Histórico" };

export default async function PaginaHistorico() {
  const { supabase, perfil } = await exigirSessao();

  const { data: pagamentos } = await supabase
    .from("pagamentos")
    .select("*, cobranca:cobrancas(tipo, titulo, competencia)")
    .eq("membro_id", perfil.id)
    .order("created_at", { ascending: false });

  const lista = pagamentos ?? [];
  const { data: links } = lista.length
    ? await supabase.storage.from("comprovantes").createSignedUrls(
        lista.map((p) => p.comprovante_path),
        60 * 10,
      )
    : { data: [] };
  const linkPorCaminho = new Map((links ?? []).map((l) => [l.path, l.signedUrl]));

  const totalPago = lista.filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.valor), 0);

  return (
    <>
      <Titulo subtitulo={`Total confirmado: ${moeda(totalPago)}`}>Meus pagamentos</Titulo>

      {lista.length === 0 ? (
        <Vazio icone={<Receipt className="size-6" />} titulo="Nenhum pagamento informado ainda">
          Quando você enviar um comprovante, ele aparece aqui.
        </Vazio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id}>
              <Cartao className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.cobranca ? tituloCobranca(p.cobranca) : "Cobrança removida"}</p>
                    <p className="text-sm text-suave">
                      {moeda(p.valor)} · pago em {data(p.data_pagamento)}
                    </p>
                  </div>
                  <Selo situacao={p.status} />
                </div>

                {p.status === "nao_pago" && p.motivo && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
                    {p.motivo}
                  </p>
                )}
                {p.observacao && <p className="mt-3 text-sm text-suave">“{p.observacao}”</p>}

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-borda pt-3 text-xs text-suave">
                  <span>
                    Enviado {dataHoraCurta(p.created_at)}
                    {p.revisado_em && ` · conferido ${dataHoraCurta(p.revisado_em)}`}
                  </span>
                  <span className="flex items-center gap-3">
                    {p.status === "em_analise" && <BotaoCancelar id={p.id} />}
                    {linkPorCaminho.get(p.comprovante_path) && (
                      <a
                        href={linkPorCaminho.get(p.comprovante_path)!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-300"
                      >
                        Comprovante <ExternalLink className="size-3" aria-hidden />
                      </a>
                    )}
                  </span>
                </div>
              </Cartao>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
