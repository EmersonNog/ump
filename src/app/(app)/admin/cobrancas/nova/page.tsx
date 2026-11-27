import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, ChevronRight, Tent } from "lucide-react";
import { Cartao, Titulo } from "@/components/ui";
import { hojeISO } from "@/lib/format";
import { FormEvento, FormMensalidades } from "../formularios";

export const metadata: Metadata = { title: "Nova cobrança" };

const OPCOES = [
  {
    tipo: "mensalidade",
    icone: CalendarDays,
    titulo: "Mensalidades",
    descricao: "Cria as 12 mensalidades de um ano, com o mesmo valor e dia de vencimento.",
  },
  {
    tipo: "evento",
    icone: Tent,
    titulo: "Evento",
    descricao: "Acampamento, retiro, congresso… Uma cobrança só, com nome, valor e vencimento.",
  },
] as const;

type Tipo = (typeof OPCOES)[number]["tipo"];
const ehTipo = (valor: unknown): valor is Tipo => OPCOES.some((o) => o.tipo === valor);

export default async function PaginaNovaCobranca({ searchParams }: PageProps<"/admin/cobrancas/nova">) {
  const { tipo: tipoParam } = await searchParams;
  const tipo = ehTipo(tipoParam) ? tipoParam : null;

  if (!tipo) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/cobrancas"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-suave transition hover:text-texto"
        >
          <ArrowLeft className="size-4" aria-hidden /> Cobranças
        </Link>
        <Titulo subtitulo="Escolha o que você vai cadastrar.">Nova cobrança</Titulo>
        <ul className="grid gap-3 sm:grid-cols-2">
          {OPCOES.map(({ tipo, icone: Icone, titulo, descricao }) => (
            <li key={tipo}>
              <Link
                href={`/admin/cobrancas/nova?tipo=${tipo}`}
                className="group flex h-full items-start gap-4 rounded-2xl border border-borda bg-superficie p-5 transition hover:border-laranja-300 hover:bg-laranja-50/40 dark:hover:border-laranja-800 dark:hover:bg-laranja-950/20"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-laranja-50 text-laranja-700 dark:bg-laranja-950/60 dark:text-laranja-300">
                  <Icone className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold tracking-tight">{titulo}</span>
                  <span className="mt-1 block text-sm text-suave text-pretty">{descricao}</span>
                </span>
                <ChevronRight
                  className="mt-1 size-5 shrink-0 text-suave transition group-hover:translate-x-0.5 group-hover:text-texto"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const opcao = OPCOES.find((o) => o.tipo === tipo)!;
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/cobrancas/nova"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-suave transition hover:text-texto"
      >
        <ArrowLeft className="size-4" aria-hidden /> Trocar tipo
      </Link>
      <Titulo subtitulo={opcao.descricao}>{tipo === "evento" ? "Novo evento" : "Gerar mensalidades do ano"}</Titulo>
      <Cartao>
        {tipo === "evento" ? <FormEvento /> : <FormMensalidades anoAtual={Number(hojeISO().slice(0, 4))} />}
      </Cartao>
    </div>
  );
}
