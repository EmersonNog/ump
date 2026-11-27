import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { EtiquetaData } from "@/components/etiqueta-data";
import { InstalarApp } from "@/components/instalar-app";
import { Aviso, BotaoLink, CabecalhoSecao, Logo, cx } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { prazo, situacaoPorCobranca, tituloCobranca, type Cobranca, type ItemCobranca } from "@/lib/cobrancas";
import { hojeISO, moeda, primeiroDiaDoMes } from "@/lib/format";

const horaSP = new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" });
const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const mesLongo = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" });

const ROTULO_SITUACAO = { pago: "pago", em_analise: "em análise", pendente: "em aberto", nao_pago: "não pago" } as const;

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

  const hoje = hojeISO();
  const mesAtual = primeiroDiaDoMes(hoje);
  const mesEntrada = primeiroDiaDoMes(perfil.created_at.slice(0, 10));

  // Mensalidades contam a partir do mês em que o membro entrou.
  const relevantes = (cobrancas ?? []).filter((c) => c.tipo === "evento" || (c.competencia ?? "") >= mesEntrada);
  const itens = situacaoPorCobranca(relevantes, pagamentos ?? []);
  const vigente = (c: Cobranca) => c.tipo === "evento" || (c.competencia ?? "") <= mesAtual;
  const aberta = (i: ItemCobranca) => i.situacao === "pendente" || i.situacao === "nao_pago";
  const aPagar = itens.filter((i) => vigente(i.cobranca) && aberta(i));
  const emAnalise = itens.filter((i) => i.situacao === "em_analise");
  const futuras = itens.filter((i) => !vigente(i.cobranca) && aberta(i));
  const totalAberto = aPagar.reduce((soma, i) => soma + Number(i.cobranca.valor), 0);

  // A mais urgente: menor vencimento (sem vencimento vai para o fim).
  const prioridade = [...aPagar].sort((a, b) =>
    (a.cobranca.vencimento ?? "9999").localeCompare(b.cobranca.vencimento ?? "9999"),
  )[0];
  const prazoPrioridade = prioridade ? prazo(prioridade.cobranca.vencimento, hoje, true) : null;

  // Linha do ano: situação de cada mês.
  const ano = hoje.slice(0, 4);
  const porMes = new Map(
    itens.flatMap((i) =>
      i.cobranca.tipo === "mensalidade" && i.cobranca.competencia?.startsWith(ano)
        ? [[Number(i.cobranca.competencia.slice(5, 7)), i.situacao] as const]
        : [],
    ),
  );
  const pagasAno = [...porMes.values()].filter((s) => s === "pago").length;
  const entrouEsteAno = mesEntrada.startsWith(ano) && mesEntrada > `${ano}-01-01`;

  const hora = Number(horaSP.format(new Date()));
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="mx-auto max-w-5xl">
      {(senha === "alterada" || enviado) && (
        <div className="mb-6">
          <Aviso tipo="sucesso">
            {enviado ? "Comprovante enviado! A diretoria vai conferir e você será avisado." : "Senha alterada com sucesso."}
          </Aviso>
        </div>
      )}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        {/* Coluna de resumo */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h1 className="text-sm text-suave">
            {saudacao}, <span className="font-semibold text-texto">{perfil.nome.split(" ")[0]}</span>
          </h1>

          {totalAberto > 0 ? (
            <section aria-label="Resumo" className="mt-6">
              <p className="text-sm text-suave">Em aberto</p>
              <p className="mt-1 font-display text-[2.75rem] leading-none font-extrabold tracking-tight tabular-nums">{moeda(totalAberto)}</p>
              <p className="mt-2 text-sm">
                <span className="text-suave">
                  {aPagar.length} {aPagar.length === 1 ? "cobrança" : "cobranças"}
                </span>
                {prazoPrioridade && (
                  <span
                    className={cx(
                      "font-medium",
                      prazoPrioridade.vencida ? "text-red-700 dark:text-red-400" : "text-suave",
                    )}
                  >
                    {" · "}
                    {prazoPrioridade.texto.charAt(0).toLowerCase() + prazoPrioridade.texto.slice(1)}
                  </span>
                )}
              </p>
              {prioridade && (
                <BotaoLink href={`/pagar/${prioridade.cobranca.id}`} className="mt-6">
                  Pagar {aPagar.length > 1 ? "a mais antiga" : "agora"} <ArrowRight className="size-4" aria-hidden />
                </BotaoLink>
              )}
            </section>
          ) : (
            // Momento da marca: estar em dia merece o anel da UMP, não só um número.
            <section aria-label="Resumo" className="mt-6 flex items-center gap-4">
              <Logo girando className="size-16 text-azul-600 dark:text-azul-300" />
              <div>
                <p className="font-display text-4xl leading-none font-black tracking-tight text-azul-700 dark:text-azul-200">Em dia</p>
                <p className="mt-1.5 text-sm text-suave">
                  {emAnalise.length > 0
                    ? `${emAnalise.length} ${emAnalise.length === 1 ? "pagamento" : "pagamentos"} em conferência.`
                    : "Nada a pagar agora. Valeu!"}
                </p>
              </div>
            </section>
          )}

          {porMes.size > 0 && (
            <section aria-labelledby="ano-titulo" className="mt-10">
              <div className="flex items-baseline justify-between text-sm">
                <h2 id="ano-titulo" className="text-suave">
                  Mensalidades {ano}
                </h2>
                <span className="tabular-nums">
                  {pagasAno} de {porMes.size} {porMes.size === 1 ? "paga" : "pagas"}
                </span>
              </div>
              <ol className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-12 sm:gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const mes = i + 1;
                  const situacao = porMes.get(mes);
                  const referencia = new Date(Date.UTC(Number(ano), i, 1));
                  const iso = `${ano}-${String(mes).padStart(2, "0")}-01`;
                  const antesDoCadastro = iso < mesEntrada;
                  const futura = iso > mesAtual;
                  const curto = mesCurto.format(referencia).replace(".", "");
                  const descricao = antesDoCadastro
                    ? "antes do seu cadastro"
                    : situacao
                      ? futura && situacao === "pendente"
                        ? "a vencer"
                        : ROTULO_SITUACAO[situacao]
                      : "sem cobrança";
                  return (
                    <li
                      key={mes}
                      className="flex flex-col items-center gap-1"
                      aria-label={`${mesLongo.format(referencia)}: ${descricao}`}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          "h-6 w-full rounded-md",
                          (antesDoCadastro || !situacao) && "border border-dashed border-borda",
                          situacao === "pago" && "bg-emerald-500",
                          situacao === "em_analise" && "bg-azul-400",
                          (situacao === "pendente" || situacao === "nao_pago") &&
                            (futura ? "bg-borda" : "bg-laranja-400"),
                        )}
                      />
                      <span aria-hidden className="text-[10px] text-suave capitalize">
                        {curto}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave" aria-hidden>
                <Legenda cor="bg-emerald-500">Pago</Legenda>
                <Legenda cor="bg-laranja-400">Em aberto</Legenda>
                <Legenda cor="bg-azul-400">Em análise</Legenda>
                <Legenda cor="bg-borda">A vencer</Legenda>
              </p>
              {entrouEsteAno && (
                <p className="mt-2 text-xs text-suave">
                  Contando a partir de {mesLongo.format(new Date(`${mesEntrada}T00:00:00Z`))}, mês do seu cadastro.
                </p>
              )}
            </section>
          )}
        </aside>

        {/* Coluna de cobranças */}
        <div className="space-y-10">
          <Lista titulo="Para pagar" vazio="Você não tem cobranças em aberto." itens={aPagar} hoje={hoje} />
          {emAnalise.length > 0 && <Lista titulo="Em conferência" itens={emAnalise} hoje={hoje} />}

          {futuras.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between border-b border-borda pb-3 text-sm text-suave hover:text-texto">
                <span>Adiantar mensalidades · {futuras.length}</span>
                <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden />
              </summary>
              <ul className="divide-y divide-borda">
                {futuras.map((i) => (
                  <LinhaCobranca key={i.cobranca.id} item={i} hoje={hoje} />
                ))}
              </ul>
            </details>
          )}

          <InstalarApp />
        </div>
      </div>
    </div>
  );
}

function Legenda({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cx("size-2 rounded-[3px]", cor)} />
      {children}
    </span>
  );
}

function Lista({ titulo, vazio, itens, hoje }: { titulo: string; vazio?: string; itens: ItemCobranca[]; hoje: string }) {
  return (
    <section>
      <CabecalhoSecao titulo={titulo} detalhe={itens.length > 0 ? itens.length : undefined} />
      {itens.length === 0 ? (
        <p className="py-6 text-sm text-suave">{vazio}</p>
      ) : (
        <ul className="divide-y divide-borda">
          {itens.map((i) => (
            <LinhaCobranca key={i.cobranca.id} item={i} hoje={hoje} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LinhaCobranca({ item, hoje }: { item: ItemCobranca; hoje: string }) {
  const { cobranca, pagamento, situacao } = item;
  const podePagar = situacao === "pendente" || situacao === "nao_pago";
  const prazoItem = prazo(cobranca.vencimento, hoje, podePagar);

  const status =
    situacao === "nao_pago"
      ? { texto: `Não pago${pagamento?.motivo ? `: ${pagamento.motivo}` : ""}`, classe: "text-red-700 dark:text-red-400" }
      : situacao === "em_analise"
        ? { texto: "A diretoria está conferindo", classe: "text-azul-700 dark:text-azul-300" }
        : prazoItem
          ? { texto: prazoItem.texto, classe: prazoItem.vencida ? "text-red-700 dark:text-red-400" : "text-suave" }
          : { texto: cobranca.tipo === "evento" ? "Evento" : "Mensalidade", classe: "text-suave" };

  const conteudo = (
    <>
      <EtiquetaData cobranca={cobranca} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 leading-snug font-medium">{tituloCobranca(cobranca)}</p>
        <p className={cx("truncate text-sm", status.classe)}>{status.texto}</p>
      </div>
      <span className="font-semibold tabular-nums">{moeda(cobranca.valor)}</span>
      {podePagar && <ChevronRight className="-mr-1 size-4 shrink-0 text-suave" aria-hidden />}
    </>
  );

  return (
    <li>
      {podePagar ? (
        <Link
          href={`/pagar/${cobranca.id}`}
          className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-4 transition hover:bg-superficie"
        >
          {conteudo}
        </Link>
      ) : (
        <div className="flex items-center gap-4 py-4">{conteudo}</div>
      )}
    </li>
  );
}
