import Link from "next/link";
import { CalendarDays, ChevronRight, PartyPopper, Wallet } from "lucide-react";
import { CopiarPix } from "@/components/copiar-pix";
import { InstalarApp } from "@/components/instalar-app";
import { Aviso, Cartao, Selo, Vazio, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { situacaoPorCobranca, tituloCobranca, type Cobranca, type ItemCobranca } from "@/lib/cobrancas";
import { data, hojeISO, moeda, primeiroDiaDoMes } from "@/lib/format";
import { pixUmp } from "@/lib/pix";

export default async function PaginaInicio({ searchParams }: PageProps<"/">) {
  const { senha, enviado } = await searchParams;
  const { supabase, perfil } = await exigirSessao();

  const [{ data: cobrancas }, { data: pagamentos }] = await Promise.all([
    supabase
      .from("cobrancas")
      .select("*")
      .eq("ativa", true)
      .order("competencia", { ascending: true, nullsFirst: false })
      .order("vencimento", { ascending: true, nullsFirst: false }),
    supabase.from("pagamentos").select("*").eq("membro_id", perfil.id),
  ]);

  const mesAtual = primeiroDiaDoMes(hojeISO());
  const mesEntrada = primeiroDiaDoMes(perfil.created_at.slice(0, 10));

  // Mensalidades contam a partir do mês em que o membro entrou.
  const relevantes = (cobrancas ?? []).filter((c) => c.tipo === "evento" || (c.competencia ?? "") >= mesEntrada);
  const itens = situacaoPorCobranca(relevantes, pagamentos ?? []);
  const vigente = (c: Cobranca) => c.tipo === "evento" || (c.competencia ?? "") <= mesAtual;
  const aPagar = itens.filter((i) => vigente(i.cobranca) && (i.situacao === "pendente" || i.situacao === "nao_pago"));
  const emAnalise = itens.filter((i) => i.situacao === "em_analise");
  const futuras = itens.filter((i) => !vigente(i.cobranca) && (i.situacao === "pendente" || i.situacao === "nao_pago"));
  const totalAberto = aPagar.reduce((soma, i) => soma + Number(i.cobranca.valor), 0);

  return (
    <div className="space-y-6">
      {senha === "alterada" && <Aviso tipo="sucesso">Senha alterada com sucesso.</Aviso>}
      {enviado && (
        <Aviso tipo="sucesso">Comprovante enviado! A diretoria vai conferir e você será avisado.</Aviso>
      )}

      <section className="animate-entrar relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-xl shadow-brand-900/20">
        <div aria-hidden className="absolute -top-16 -right-10 size-48 rounded-full bg-ouro-400/20 blur-2xl" />
        <p className="text-sm text-brand-100">{totalAberto > 0 ? "Total em aberto" : "Tudo em dia"}</p>
        <p className="mt-1 font-serif text-4xl font-semibold tracking-tight">{moeda(totalAberto)}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">
            {aPagar.length} {aPagar.length === 1 ? "pendência" : "pendências"}
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1">{emAnalise.length} em análise</span>
        </div>
      </section>

      <InstalarApp />

      <Cartao className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-ouro-300/30 text-ouro-600 dark:text-ouro-300">
          <Wallet className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-suave">Chave Pix · {pixUmp.favorecido}</p>
          <p data-selecionavel className="truncate font-mono text-sm font-semibold">
            {pixUmp.chave}
          </p>
        </div>
        <CopiarPix texto={pixUmp.chave} />
      </Cartao>

      <section>
        <h2 className="mb-3 font-serif text-lg font-semibold">Para pagar</h2>
        {aPagar.length === 0 ? (
          <Vazio icone={<PartyPopper className="size-6" />} titulo="Nenhuma pendência">
            Obrigado por manter suas contribuições em dia!
          </Vazio>
        ) : (
          <ListaCobrancas itens={aPagar} />
        )}
      </section>

      {emAnalise.length > 0 && (
        <section>
          <h2 className="mb-3 font-serif text-lg font-semibold">Aguardando conferência</h2>
          <ListaCobrancas itens={emAnalise} />
        </section>
      )}

      {futuras.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-serif text-lg font-semibold">
            <ChevronRight className="size-5 transition group-open:rotate-90" aria-hidden />
            Adiantar mensalidades
            <span className="font-sans text-sm font-normal text-suave">({futuras.length})</span>
          </summary>
          <div className="mt-3">
            <ListaCobrancas itens={futuras} />
          </div>
        </details>
      )}
    </div>
  );
}

function ListaCobrancas({ itens }: { itens: ItemCobranca[] }) {
  return (
    <ul className="space-y-2.5">
      {itens.map(({ cobranca, pagamento, situacao }) => {
        const podePagar = situacao === "pendente" || situacao === "nao_pago";
        const conteudo = (
          <>
            <div
              className={cx(
                "grid size-11 shrink-0 place-items-center rounded-xl",
                cobranca.tipo === "evento"
                  ? "bg-ouro-300/30 text-ouro-600 dark:text-ouro-300"
                  : "bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200",
              )}
            >
              <CalendarDays className="size-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 font-semibold">{tituloCobranca(cobranca)}</p>
              <p className="text-sm text-suave">
                {moeda(cobranca.valor)}
                {cobranca.vencimento && ` · vence ${data(cobranca.vencimento)}`}
              </p>
              {situacao === "nao_pago" && pagamento?.motivo && (
                <p className="mt-1 text-xs text-red-700 dark:text-red-300">Motivo: {pagamento.motivo}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Selo situacao={situacao} />
              {podePagar && (
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-300">
                  {situacao === "nao_pago" ? "Reenviar" : "Informar"} →
                </span>
              )}
            </div>
          </>
        );

        return (
          <li key={cobranca.id}>
            {podePagar ? (
              <Link
                href={`/pagar/${cobranca.id}`}
                className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3.5 shadow-sm transition hover:border-brand-300 active:scale-[0.99]"
              >
                {conteudo}
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-3.5">{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
