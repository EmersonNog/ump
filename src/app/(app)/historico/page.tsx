import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { CabecalhoSecao, Selo, Titulo, Vazio } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { tituloCobranca } from "@/lib/cobrancas";
import { data, dataHoraCurta, moeda } from "@/lib/format";
import { BotaoCancelar } from "./botao-cancelar";

export const metadata: Metadata = { title: "Histórico" };

const fuso = "America/Sao_Paulo";
const diaSP = new Intl.DateTimeFormat("pt-BR", { day: "numeric", timeZone: fuso });
const mesCurtoSP = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: fuso });
const mesAnoSP = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: fuso });

const capitalizar = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

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

  // Agrupa por mês de envio, mantendo a ordem (mais recente primeiro).
  const grupos = new Map<string, typeof lista>();
  for (const p of lista) {
    const mes = capitalizar(mesAnoSP.format(new Date(p.created_at)));
    grupos.set(mes, [...(grupos.get(mes) ?? []), p]);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Titulo subtitulo={`Total confirmado: ${moeda(totalPago)}`}>Meus pagamentos</Titulo>

      {lista.length === 0 ? (
        <Vazio titulo="Nenhum pagamento informado ainda">
          Quando você enviar um comprovante, ele aparece aqui.
        </Vazio>
      ) : (
        <div className="space-y-10">
          {[...grupos].map(([mes, itens]) => (
            <section key={mes}>
              <CabecalhoSecao titulo={mes} detalhe={itens.length} />
              <ul className="divide-y divide-borda">
                {itens.map((p) => {
                  const enviado = new Date(p.created_at);
                  const link = linkPorCaminho.get(p.comprovante_path);
                  return (
                    <li key={p.id} className="flex items-start gap-4 py-4">
                      <div className="w-10 shrink-0 text-center leading-tight">
                        <p className="text-[11px] font-semibold text-suave">
                          {capitalizar(mesCurtoSP.format(enviado).replace(".", ""))}
                        </p>
                        <p className="text-lg font-semibold tabular-nums">{diaSP.format(enviado)}</p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 leading-snug font-medium">
                          {p.cobranca ? tituloCobranca(p.cobranca) : "Cobrança removida"}
                        </p>
                        <p className="truncate text-sm text-suave">Data do pagamento: {data(p.data_pagamento)}</p>
                        {p.status === "nao_pago" && p.motivo && (
                          <p className="mt-1 text-sm break-words text-red-700 dark:text-red-400">Não pago: {p.motivo}</p>
                        )}
                        {p.observacao && (
                          <p className="mt-1 line-clamp-2 text-sm break-words text-suave">“{p.observacao}”</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-suave">
                          {p.revisado_em && <span>Conferido em {dataHoraCurta(p.revisado_em)}</span>}
                          {link && (
                            <a
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-medium text-texto transition hover:text-laranja-600 dark:hover:text-laranja-400"
                            >
                              Ver comprovante <ExternalLink className="size-3" aria-hidden />
                            </a>
                          )}
                          {p.status === "em_analise" && <BotaoCancelar id={p.id} />}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className="font-medium tabular-nums">{moeda(p.valor)}</span>
                        <Selo situacao={p.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
