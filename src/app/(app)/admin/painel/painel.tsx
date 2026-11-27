"use client";

import { ArrowDownUp, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { BotaoEnviar } from "@/components/botao-enviar";
import { Aviso, Botao, Campo, Entrada, Selecao, cx } from "@/components/ui";
import { excluirLancamento, salvarLancamento } from "./actions";

export type Lancamento = {
  id: string;
  /** Ordem de inclusão (desempate na ordenação). */
  ordem: number;
  data: string;
  detalhes: string;
  valor: number;
  categoria: string;
  forma: string;
  origem: string;
  socio: string | null;
  doApp: boolean;
};

type Filtros = {
  ano: string;
  origem: string;
  forma: string;
  socio: string;
  direcao: "" | "entrada" | "saida";
  mes: string;
  categoria: string;
  busca: string;
  alerta: "" | "semCategoria" | "semForma" | "duplicado";
};
type Ignorar = Partial<Record<keyof Filtros, true>>;
type Coluna = "data" | "detalhes" | "socio" | "categoria" | "forma" | "origem" | "valor";

const VAZIO: Filtros = { ano: "", origem: "", forma: "", socio: "", direcao: "", mes: "", categoria: "", busca: "", alerta: "" };
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moeda = (v: number) => brl.format(v);
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (m: string) => `${MESES[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;
const dataBR = (d: string) => d.split("-").reverse().join("/");
const PALETA = ["#0027CA", "#FF6600", "#12B76A", "#6F8BFF", "#F59E0B", "#8B5CF6", "#9CA3AF"];
const ALERTAS = [
  { chave: "semCategoria", titulo: "Sem categoria", detalhe: "Lançamentos em branco ou “??”" },
  { chave: "semForma", titulo: "Sem forma de pagamento", detalhe: "Campo não informado" },
  { chave: "duplicado", titulo: "Possíveis duplicados", detalhe: "Mesma data, descrição e valor" },
] as const;
const POR_PAGINA = 60;

const soma = (lista: Lancamento[]) => lista.reduce((s, l) => s + l.valor, 0);
function agrupar(lista: Lancamento[], chave: (l: Lancamento) => string | null) {
  const grupos = new Map<string, number>();
  for (const l of lista) {
    const k = chave(l);
    if (k) grupos.set(k, (grupos.get(k) ?? 0) + Math.abs(l.valor));
  }
  return [...grupos].map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
}

/** Painel do livro financeiro: filtros, totais, gráficos, conferência e a lista de lançamentos. */
export function Painel({ lancamentos, socios }: { lancamentos: Lancamento[]; socios: Record<string, string> }) {
  const [f, setF] = useState<Filtros>(VAZIO);
  const [visao, setVisao] = useState<"saida" | "entrada">("saida");
  const [ordem, setOrdem] = useState<{ coluna: Coluna; sentido: 1 | -1 }>({ coluna: "data", sentido: -1 });
  const [pagina, setPagina] = useState(1);
  const [editando, setEditando] = useState<Lancamento | "novo" | null>(null);

  const duplicados = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const l of lancamentos) {
      const k = `${l.data}|${l.detalhes}|${l.valor}`;
      contagem.set(k, (contagem.get(k) ?? 0) + 1);
    }
    return new Set(lancamentos.filter((l) => (contagem.get(`${l.data}|${l.detalhes}|${l.valor}`) ?? 0) > 1).map((l) => l.id));
  }, [lancamentos]);

  const testaAlerta = (l: Lancamento, a: Filtros["alerta"]) =>
    a === "semCategoria" ? l.categoria === "Sem categoria" : a === "semForma" ? l.forma === "Não informado" : duplicados.has(l.id);

  /** Aplica os filtros; `ignorar` deixa de fora os que o próprio gráfico controla. */
  function passa(l: Lancamento, ignorar: Ignorar = {}) {
    const busca = f.busca.toLowerCase();
    return (
      (ignorar.ano || !f.ano || l.data.startsWith(f.ano)) &&
      (ignorar.origem || !f.origem || l.origem === f.origem) &&
      (ignorar.forma || !f.forma || l.forma === f.forma) &&
      (ignorar.socio || !f.socio || l.socio === f.socio) &&
      (ignorar.direcao || !f.direcao || (f.direcao === "entrada" ? l.valor > 0 : l.valor < 0)) &&
      (ignorar.mes || !f.mes || l.data.startsWith(f.mes)) &&
      (ignorar.categoria || !f.categoria || l.categoria === f.categoria) &&
      (!busca || `${l.detalhes} ${l.categoria} ${l.socio ?? ""} ${l.socio ? socios[l.socio] : ""}`.toLowerCase().includes(busca)) &&
      (ignorar.alerta || !f.alerta || testaAlerta(l, f.alerta))
    );
  }

  const alterar = (parcial: Partial<Filtros>) => {
    setF((atual) => ({ ...atual, ...parcial }));
    setPagina(1);
  };
  const alternar = (chave: "mes" | "categoria" | "socio" | "forma" | "alerta", valor: string) =>
    alterar({ [chave]: f[chave] === valor ? "" : valor } as Partial<Filtros>);

  const linhas = lancamentos.filter((l) => passa(l));
  const entradas = soma(linhas.filter((l) => l.valor > 0));
  const saidas = -soma(linhas.filter((l) => l.valor < 0));
  const deSocios = soma(linhas.filter((l) => l.valor > 0 && l.socio));

  // Por mês (o próprio gráfico ignora o filtro de mês para continuar mostrando todos).
  const porMes = new Map<string, { m: string; e: number; s: number }>();
  for (const l of lancamentos.filter((l) => passa(l, { mes: true }))) {
    const m = l.data.slice(0, 7);
    const x = porMes.get(m) ?? { m, e: 0, s: 0 };
    if (l.valor > 0) x.e += l.valor;
    else x.s -= l.valor;
    porMes.set(m, x);
  }
  const meses = [...porMes.values()].sort((a, b) => a.m.localeCompare(b.m));

  const daVisao = (l: Lancamento) => (visao === "entrada" ? l.valor > 0 : l.valor < 0);
  const categorias = agrupar(lancamentos.filter((l) => passa(l, { categoria: true, direcao: true }) && daVisao(l)), (l) => l.categoria);
  const formas = agrupar(lancamentos.filter((l) => passa(l, { forma: true, direcao: true }) && daVisao(l)), (l) => l.forma);
  const topSocios = agrupar(lancamentos.filter((l) => passa(l, { socio: true, direcao: true }) && daVisao(l)), (l) => l.socio).slice(0, 10);
  const baseAlertas = lancamentos.filter((l) => passa(l, { alerta: true }));

  const ordenadas = [...linhas].sort((a, b) => {
    const va = ordem.coluna === "socio" ? (a.socio ?? "") : a[ordem.coluna];
    const vb = ordem.coluna === "socio" ? (b.socio ?? "") : b[ordem.coluna];
    return (va < vb ? -1 : va > vb ? 1 : a.ordem - b.ordem) * ordem.sentido;
  });
  const visiveis = ordenadas.slice(0, pagina * POR_PAGINA);

  const unicos = (k: (l: Lancamento) => string) => [...new Set(lancamentos.map(k))].sort();
  const anos = unicos((l) => l.data.slice(0, 4));
  const datas = lancamentos.map((l) => l.data).sort();
  const filtrosAtivos = JSON.stringify(f) !== JSON.stringify(VAZIO);
  const chips = [
    f.mes && { chave: "mes" as const, texto: `Mês: ${rotuloMes(f.mes)}` },
    f.categoria && { chave: "categoria" as const, texto: `Categoria: ${f.categoria}` },
    f.socio && { chave: "socio" as const, texto: `Sócio: ${f.socio} · ${socios[f.socio] ?? ""}` },
    f.alerta && { chave: "alerta" as const, texto: `Conferência: ${ALERTAS.find((a) => a.chave === f.alerta)?.titulo}` },
  ].filter(Boolean) as { chave: keyof Filtros; texto: string }[];

  function ordenarPor(coluna: Coluna) {
    setOrdem((o) => ({ coluna, sentido: o.coluna === coluna ? (-o.sentido as 1 | -1) : coluna === "data" || coluna === "valor" ? -1 : 1 }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Livro financeiro</h1>
          <p className="mt-1 text-sm text-suave">
            {datas.length
              ? `${dataBR(datas[0])} a ${dataBR(datas[datas.length - 1])} · ${lancamentos.length} lançamentos`
              : "Nenhum lançamento ainda"}
          </p>
        </div>
        <Botao onClick={() => setEditando("novo")} className="max-sm:w-full">
          <Plus className="size-4" aria-hidden /> Lançamento
        </Botao>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Selecao aria-label="Ano" value={f.ano} onChange={(e) => alterar({ ano: e.target.value })}>
          <option value="">Todos os anos</option>
          {anos.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </Selecao>
        <Selecao aria-label="Origem" value={f.origem} onChange={(e) => alterar({ origem: e.target.value })}>
          <option value="">Todas as origens</option>
          {unicos((l) => l.origem).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Selecao>
        <Selecao aria-label="Forma de pagamento" value={f.forma} onChange={(e) => alterar({ forma: e.target.value })}>
          <option value="">Todas as formas</option>
          {unicos((l) => l.forma).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Selecao>
        <Selecao aria-label="Sócio" value={f.socio} onChange={(e) => alterar({ socio: e.target.value })}>
          <option value="">Todos os sócios</option>
          {unicos((l) => l.socio ?? "")
            .filter(Boolean)
            .map((s) => (
              <option key={s} value={s}>
                {s} · {socios[s]}
              </option>
            ))}
        </Selecao>
        <Selecao aria-label="Entradas ou saídas" value={f.direcao} onChange={(e) => alterar({ direcao: e.target.value as Filtros["direcao"] })}>
          <option value="">Entradas e saídas</option>
          <option value="entrada">Só entradas</option>
          <option value="saida">Só saídas</option>
        </Selecao>
        <label className="relative col-span-2 sm:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-suave" aria-hidden />
          <Entrada
            aria-label="Buscar"
            value={f.busca}
            onChange={(e) => alterar({ busca: e.target.value })}
            placeholder="Buscar detalhes, categoria, sócio"
            className="pl-9"
          />
        </label>
      </div>
      {(chips.length > 0 || filtrosAtivos) && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.chave}
              type="button"
              onClick={() => alterar({ [c.chave]: "" })}
              className="inline-flex items-center gap-1.5 rounded-full bg-azul-50 px-3 py-1 text-sm font-medium text-azul-800 dark:bg-azul-950/70 dark:text-azul-200"
            >
              {c.texto} <X className="size-3.5" aria-hidden />
            </button>
          ))}
          <button type="button" onClick={() => alterar(VAZIO)} className="text-sm font-medium text-suave hover:text-texto">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Totais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Indicador rotulo="Entradas" valor={moeda(entradas)} classe="text-emerald-700 dark:text-emerald-400" />
        <Indicador rotulo="Saídas" valor={moeda(saidas)} classe="text-red-700 dark:text-red-400" />
        <Indicador
          rotulo="Saldo do período"
          valor={moeda(entradas - saidas)}
          classe={entradas - saidas < 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}
        />
        <Indicador
          rotulo="Entradas de sócios"
          valor={moeda(deSocios)}
          detalhe={`${entradas ? Math.round((deSocios / entradas) * 100) : 0}% das entradas`}
        />
        <Indicador rotulo="Lançamentos" valor={String(linhas.length)} className="col-span-2 lg:col-span-1" />
      </div>

      {/* Gráficos por mês */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Entradas e saídas por mês" detalhe="Toque num mês para filtrar">
          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:thin]">
            <div className="flex h-48 items-end gap-1" style={{ minWidth: meses.length * 20 }}>
              {meses.map((x, i) => {
                const maior = Math.max(1, ...meses.map((y) => Math.max(y.e, y.s)));
                return (
                  <button
                    key={x.m}
                    type="button"
                    onClick={() => alternar("mes", x.m)}
                    title={`${rotuloMes(x.m)} · entradas ${moeda(x.e)} · saídas ${moeda(x.s)}`}
                    className={cx(
                      "flex h-full min-w-0 flex-1 flex-col items-center gap-1.5 rounded-lg pt-1 transition",
                      f.mes === x.m ? "bg-azul-50 dark:bg-azul-950/70" : "hover:bg-fundo",
                      f.mes && f.mes !== x.m && "opacity-45",
                    )}
                  >
                    <span className="flex w-full flex-1 items-end justify-center gap-0.5">
                      <span className="w-full max-w-2.5 rounded-t-sm bg-emerald-500" style={{ height: `${(x.e / maior) * 100}%` }} />
                      <span className="w-full max-w-2.5 rounded-t-sm bg-laranja-500" style={{ height: `${(x.s / maior) * 100}%` }} />
                    </span>
                    <span className="pb-1 text-center text-[10px] leading-tight whitespace-nowrap text-suave">
                      {MESES[Number(x.m.slice(5, 7)) - 1]}
                      {/* Ano só no primeiro mês e em janeiro, para não amontoar. */}
                      <span className="block h-3 font-semibold">{i === 0 || x.m.endsWith("-01") ? x.m.slice(0, 4) : ""}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-suave">
            <Legenda cor="bg-emerald-500">Entradas</Legenda>
            <Legenda cor="bg-laranja-500">Saídas</Legenda>
          </div>
        </Bloco>
        <Bloco titulo="Saldo acumulado" detalhe={meses.length ? `${rotuloMes(meses[0].m)} a ${rotuloMes(meses[meses.length - 1].m)}` : undefined}>
          <SaldoAcumulado meses={meses} />
        </Bloco>
      </div>

      {/* Categorias, formas e sócios */}
      <div className="inline-flex rounded-xl border border-borda bg-fundo p-1" role="tablist" aria-label="Ver categorias de">
        {(["saida", "entrada"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={visao === v}
            onClick={() => setVisao(v)}
            className={cx(
              "h-9 rounded-lg px-4 text-sm transition",
              visao === v ? "bg-superficie font-semibold text-texto shadow-sm ring-1 ring-borda" : "text-suave hover:text-texto",
            )}
          >
            {v === "saida" ? "Saídas" : "Entradas"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco titulo="Categorias">
          <Rosca itens={categorias} selecionado={f.categoria} aoEscolher={(k) => alternar("categoria", k)} />
          <ListaBarras
            itens={categorias}
            selecionado={f.categoria}
            aoEscolher={(k) => alternar("categoria", k)}
            cor={visao === "entrada" ? "bg-emerald-500" : "bg-laranja-500"}
          />
        </Bloco>
        <div className="space-y-4">
          <Bloco titulo="Forma de pagamento">
            <ListaBarras
              itens={formas}
              selecionado={f.forma}
              aoEscolher={(k) => alternar("forma", k)}
              cor={visao === "entrada" ? "bg-emerald-500" : "bg-laranja-500"}
            />
          </Bloco>
          <Bloco titulo="Sócios com ID" detalhe="10 maiores">
            {topSocios.length ? (
              <ListaBarras
                itens={topSocios}
                selecionado={f.socio}
                aoEscolher={(k) => alternar("socio", k)}
                rotulo={(k) => `${k} · ${socios[k] ?? ""}`}
                cor={visao === "entrada" ? "bg-emerald-500" : "bg-laranja-500"}
              />
            ) : (
              <p className="py-4 text-sm text-suave">Nenhum sócio neste filtro.</p>
            )}
          </Bloco>
        </div>
      </div>

      {/* Conferência */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Conferência antes da auditoria</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {ALERTAS.map((a) => {
            const itens = baseAlertas.filter((l) => testaAlerta(l, a.chave));
            const ativo = f.alerta === a.chave;
            return (
              <button
                key={a.chave}
                type="button"
                onClick={() => alternar("alerta", a.chave)}
                aria-pressed={ativo}
                className={cx(
                  "rounded-2xl border p-4 text-left transition",
                  ativo ? "border-laranja-500 bg-laranja-50 dark:bg-laranja-950/40" : "border-borda bg-superficie hover:border-laranja-300",
                )}
              >
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-2xl font-bold text-laranja-700 tabular-nums dark:text-laranja-300">{itens.length}</span>
                  <span className="text-sm text-suave tabular-nums">{moeda(Math.abs(soma(itens)))}</span>
                </p>
                <p className="mt-1 text-sm font-semibold">{a.titulo}</p>
                <p className="text-xs text-suave">{a.detalhe}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Lançamentos */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Lançamentos <span className="font-normal text-suave">({linhas.length})</span>
        </h2>
        {linhas.length === 0 ? (
          <p className="rounded-2xl border border-borda bg-superficie py-10 text-center text-sm text-suave">Nenhum lançamento neste filtro.</p>
        ) : (
          <>
            {/* Celular */}
            <ul className="divide-y divide-borda rounded-2xl border border-borda bg-superficie md:hidden">
              {visiveis.map((l) => (
                <li key={l.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium">
                      {l.detalhes}
                      {duplicados.has(l.id) && <EtiquetaDuplicado />}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-suave">
                      {dataBR(l.data)} · {l.categoria} · {l.forma}
                      {l.socio ? ` · ${l.socio}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cx("font-semibold tabular-nums", l.valor < 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")}>
                      {moeda(l.valor)}
                    </span>
                    <AcoesLancamento lancamento={l} aoEditar={() => setEditando(l)} />
                  </div>
                </li>
              ))}
            </ul>
            {/* Computador */}
            <div className="hidden overflow-hidden rounded-2xl border border-borda bg-superficie md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-borda text-left text-xs text-suave">
                  <tr>
                    {(
                      [
                        ["data", "Data"],
                        ["detalhes", "Detalhes"],
                        ["socio", "ID"],
                        ["categoria", "Categoria"],
                        ["forma", "Pagamento"],
                        ["origem", "Origem"],
                        ["valor", "Valor"],
                      ] as [Coluna, string][]
                    ).map(([coluna, rotulo]) => (
                      <th key={coluna} className={cx("px-3 py-2.5 font-medium", coluna === "valor" && "text-right")}>
                        <button
                          type="button"
                          onClick={() => ordenarPor(coluna)}
                          className={cx("inline-flex items-center gap-1 hover:text-texto", ordem.coluna === coluna && "text-texto")}
                        >
                          {rotulo}
                          <ArrowDownUp className={cx("size-3", ordem.coluna !== coluna && "opacity-40")} aria-hidden />
                        </button>
                      </th>
                    ))}
                    <th className="w-20 px-3 py-2.5">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {visiveis.map((l) => (
                    <tr key={l.id} className="hover:bg-fundo/60">
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">{dataBR(l.data)}</td>
                      <td className="px-3 py-2.5">
                        {l.detalhes}
                        {duplicados.has(l.id) && <EtiquetaDuplicado />}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-suave" title={l.socio ? socios[l.socio] : undefined}>
                        {l.socio ?? "–"}
                      </td>
                      <td className="px-3 py-2.5">{l.categoria}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{l.forma}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{l.origem}</td>
                      <td
                        className={cx(
                          "px-3 py-2.5 text-right font-medium whitespace-nowrap tabular-nums",
                          l.valor < 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400",
                        )}
                      >
                        {moeda(l.valor)}
                      </td>
                      <td className="px-2 py-1.5">
                        <AcoesLancamento lancamento={l} aoEditar={() => setEditando(l)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visiveis.length < linhas.length && (
              <div className="mt-3 text-center">
                <Botao variante="secundario" onClick={() => setPagina((p) => p + 1)}>
                  Mostrar mais ({linhas.length - visiveis.length} restantes)
                </Botao>
              </div>
            )}
          </>
        )}
        <p className="mt-4 text-xs text-suave">
          Entrada = valor positivo; saída = valor negativo. “Livro” = lançado à mão; “Relatório bancário” = extrato do banco; “App” =
          comprovante aprovado no app, lançado sozinho. O ID identifica o sócio na lista de sócios.
        </p>
      </section>

      {editando && (
        <DialogoLancamento
          key={editando === "novo" ? "novo" : editando.id}
          lancamento={editando === "novo" ? null : editando}
          categorias={unicos((l) => l.categoria)}
          socios={socios}
          aoFechar={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function Indicador({ rotulo, valor, detalhe, classe, className }: { rotulo: string; valor: string; detalhe?: string; classe?: string; className?: string }) {
  return (
    <div className={cx("rounded-2xl border border-borda bg-superficie p-4", className)}>
      <p className="text-xs text-suave">{rotulo}</p>
      <p className={cx("mt-1 font-display text-xl font-bold tracking-tight tabular-nums sm:text-2xl", classe)}>{valor}</p>
      {detalhe && <p className="mt-0.5 text-xs text-suave">{detalhe}</p>}
    </div>
  );
}

function Bloco({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-borda bg-superficie p-4 sm:p-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{titulo}</h2>
        {detalhe && <span className="text-xs text-suave">{detalhe}</span>}
      </div>
      {children}
    </section>
  );
}

function Legenda({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cx("size-2 rounded-[3px]", cor)} aria-hidden />
      {children}
    </span>
  );
}

function SaldoAcumulado({ meses }: { meses: { m: string; e: number; s: number }[] }) {
  if (!meses.length) return <p className="py-10 text-center text-sm text-suave">Sem dados neste filtro.</p>;
  const pontos = meses.reduce<number[]>((acc, x) => [...acc, (acc.at(-1) ?? 0) + x.e - x.s], []);
  const [L, A, M] = [320, 150, 10];
  const menor = Math.min(0, ...pontos);
  const maior = Math.max(0, ...pontos);
  const X = (i: number) => M + (meses.length > 1 ? (i * (L - 2 * M)) / (meses.length - 1) : (L - 2 * M) / 2);
  const Y = (v: number) => A - M - ((v - menor) / (maior - menor || 1)) * (A - 2 * M);
  const final = pontos[pontos.length - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${L} ${A}`} className="w-full" role="img" aria-label={`Saldo final ${moeda(final)}`}>
        <line x1="0" x2={L} y1={Y(0)} y2={Y(0)} stroke="var(--borda)" strokeDasharray="3 3" />
        <polygon
          points={`${X(0)},${Y(0)} ${pontos.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} ${X(pontos.length - 1)},${Y(0)}`}
          fill="#0027CA"
          opacity="0.08"
        />
        <polyline points={pontos.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} fill="none" stroke="#0027CA" strokeWidth="2" strokeLinejoin="round" />
        {pontos.map((v, i) => (
          <circle key={meses[i].m} cx={X(i)} cy={Y(v)} r="3" fill={v < 0 ? "#dc2626" : "#0027CA"}>
            <title>{`${rotuloMes(meses[i].m)} · saldo acumulado ${moeda(v)}`}</title>
          </circle>
        ))}
      </svg>
      <p className="mt-2 text-xs text-suave">
        Saldo final <span className={cx("font-semibold", final < 0 ? "text-red-700 dark:text-red-400" : "text-texto")}>{moeda(final)}</span>
      </p>
    </div>
  );
}

function Rosca({ itens, selecionado, aoEscolher }: { itens: { k: string; v: number }[]; selecionado: string; aoEscolher: (k: string) => void }) {
  const total = itens.reduce((s, x) => s + x.v, 0) || 1;
  const resto = itens.slice(6).reduce((s, x) => s + x.v, 0);
  const fatias = resto > 0 ? [...itens.slice(0, 6), { k: "Outras", v: resto }] : itens.slice(0, 6);
  // Início de cada fatia, em % do círculo.
  const inicios = fatias.reduce<number[]>((acc, x, i) => [...acc, i === 0 ? 0 : acc[i - 1] + (fatias[i - 1].v / total) * 100], []);
  return (
    <div className="mb-4 flex items-center gap-5">
      <svg viewBox="0 0 42 42" className="size-32 shrink-0 -rotate-90" aria-hidden>
        {fatias.map((x, i) => {
          const p = (x.v / total) * 100;
          return (
            <circle
              key={x.k}
              r="15.9155"
              cx="21"
              cy="21"
              fill="none"
              stroke={PALETA[i]}
              strokeWidth={selecionado === x.k ? 7 : 5}
              strokeDasharray={`${p} ${100 - p}`}
              strokeDashoffset={-inicios[i]}
              className={x.k !== "Outras" ? "cursor-pointer" : undefined}
              onClick={() => x.k !== "Outras" && aoEscolher(x.k)}
            >
              <title>{`${x.k} · ${moeda(x.v)} (${p.toFixed(1)}%)`}</title>
            </circle>
          );
        })}
      </svg>
      <ul className="grid gap-1 text-xs">
        {fatias.map((x, i) => (
          <li key={x.k} className="flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ background: PALETA[i] }} aria-hidden />
            <span className="truncate">{x.k}</span>
            <span className="text-suave tabular-nums">{Math.round((x.v / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListaBarras({
  itens,
  selecionado,
  aoEscolher,
  rotulo = (k) => k,
  cor,
}: {
  itens: { k: string; v: number }[];
  selecionado: string;
  aoEscolher: (k: string) => void;
  rotulo?: (k: string) => string;
  cor: string;
}) {
  const [todos, setTodos] = useState(false);
  const maior = Math.max(1, ...itens.map((x) => x.v));
  const LIMITE = 8;
  // O item escolhido continua visível mesmo fora dos primeiros.
  const mostrados = todos ? itens : itens.filter((x, i) => i < LIMITE || x.k === selecionado);
  return (
    <ul className="space-y-1">
      {mostrados.map((x) => (
        <li key={x.k}>
          <button
            type="button"
            onClick={() => aoEscolher(x.k)}
            aria-pressed={selecionado === x.k}
            className={cx(
              "grid w-full grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition sm:grid-cols-[minmax(0,12rem)_1fr_auto]",
              selecionado === x.k ? "bg-azul-50 dark:bg-azul-950/70" : "hover:bg-fundo",
            )}
          >
            <span className="truncate" title={rotulo(x.k)}>
              {rotulo(x.k)}
            </span>
            <span className="h-2 overflow-hidden rounded-full bg-fundo">
              <span className={cx("block h-full rounded-full", cor)} style={{ width: `${(x.v / maior) * 100}%` }} />
            </span>
            <span className="text-xs text-suave tabular-nums">{moeda(x.v)}</span>
          </button>
        </li>
      ))}
      {itens.length > LIMITE && (
        <li>
          <button type="button" onClick={() => setTodos((t) => !t)} className="px-2 pt-1 text-sm font-medium text-azul-700 hover:underline dark:text-azul-300">
            {todos ? "Mostrar menos" : `Ver todas (${itens.length})`}
          </button>
        </li>
      )}
    </ul>
  );
}

function EtiquetaDuplicado() {
  return (
    <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-px text-[11px] font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      duplicado?
    </span>
  );
}

function AcoesLancamento({ lancamento, aoEditar }: { lancamento: Lancamento; aoEditar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  const [pendente, iniciar] = useTransition();
  if (confirmar) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <button
          type="button"
          disabled={pendente}
          onClick={() => iniciar(async () => void (await excluirLancamento(lancamento.id)))}
          className="rounded-lg bg-red-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          Excluir
        </button>
        <button type="button" onClick={() => setConfirmar(false)} className="rounded-lg px-2 py-1 text-xs font-medium text-suave">
          Não
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex">
      <button
        type="button"
        onClick={aoEditar}
        aria-label={`Editar ${lancamento.detalhes}`}
        className="grid size-8 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-texto"
      >
        <Pencil className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        disabled={lancamento.doApp}
        title={lancamento.doApp ? "Veio de um comprovante aprovado: para tirar, mude o comprovante para “não pago” ou “em análise”." : undefined}
        aria-label={`Excluir ${lancamento.detalhes}`}
        className="grid size-8 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-red-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-suave"
      >
        <Trash2 className="size-3.5" aria-hidden />
      </button>
    </span>
  );
}

function DialogoLancamento({
  lancamento,
  categorias,
  socios,
  aoFechar,
}: {
  lancamento: Lancamento | null;
  categorias: string[];
  socios: Record<string, string>;
  aoFechar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [estado, acao] = useActionState(salvarLancamento, {});
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (estado.sucesso) aoFechar();
  }, [estado, aoFechar]);

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-2xl border border-borda bg-superficie p-0 text-texto shadow-2xl backdrop:bg-azul-950/40"
    >
      <form action={acao} className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{lancamento ? "Editar lançamento" : "Novo lançamento"}</h2>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fechar" className="grid size-9 place-items-center rounded-full text-suave hover:bg-fundo">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {estado.erro && <Aviso>{estado.erro}</Aviso>}
        {lancamento && <input type="hidden" name="id" value={lancamento.id} />}
        <fieldset className="grid grid-cols-2 gap-1 rounded-xl border border-borda bg-fundo p-1">
          <legend className="sr-only">Tipo</legend>
          {(
            [
              ["entrada", "Entrada"],
              ["saida", "Saída"],
            ] as const
          ).map(([v, r]) => (
            <label
              key={v}
              className="flex h-9 cursor-pointer items-center justify-center rounded-lg text-sm font-medium text-suave has-checked:bg-superficie has-checked:text-texto has-checked:shadow-sm has-checked:ring-1 has-checked:ring-borda"
            >
              <input
                type="radio"
                name="direcao"
                value={v}
                defaultChecked={lancamento ? (v === "saida") === lancamento.valor < 0 : v === "entrada"}
                className="sr-only"
              />
              {r}
            </label>
          ))}
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Data">
            <Entrada name="data" type="date" defaultValue={lancamento?.data ?? hoje} required />
          </Campo>
          <Campo rotulo="Valor (R$)">
            <Entrada
              name="valor"
              inputMode="decimal"
              defaultValue={lancamento ? Math.abs(lancamento.valor).toFixed(2).replace(".", ",") : ""}
              placeholder="0,00"
              required
            />
          </Campo>
        </div>
        <Campo rotulo="Detalhes">
          <Entrada name="detalhes" defaultValue={lancamento?.detalhes} placeholder="Ex.: Compra dos ingredientes" required maxLength={300} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Categoria">
            <Entrada name="categoria" list="categorias-livro" defaultValue={lancamento?.categoria ?? ""} placeholder="Ex.: Comida" maxLength={60} />
            <datalist id="categorias-livro">
              {categorias.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Campo>
          <Campo rotulo="Forma">
            <Selecao name="forma" defaultValue={lancamento?.forma ?? "Pix"}>
              {["Pix", "Cartão", "Dinheiro", "Não informado"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Selecao>
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Origem">
            <Selecao name="origem" defaultValue={lancamento?.origem ?? "Livro"}>
              {["Livro", "Relatório bancário", "App"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Selecao>
          </Campo>
          <Campo rotulo="Sócio" dica="Opcional">
            <Selecao name="socio" defaultValue={lancamento?.socio ?? ""}>
              <option value="">Nenhum</option>
              {Object.entries(socios).map(([id, nome]) => (
                <option key={id} value={id}>
                  {id} · {nome}
                </option>
              ))}
            </Selecao>
          </Campo>
        </div>
        <div className="flex gap-2 pt-1">
          <BotaoEnviar className="flex-1">{lancamento ? "Salvar" : "Adicionar"}</BotaoEnviar>
          <Botao type="button" variante="secundario" onClick={() => ref.current?.close()}>
            Cancelar
          </Botao>
        </div>
      </form>
    </dialog>
  );
}
