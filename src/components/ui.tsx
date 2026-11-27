import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";

export { clsx as cx };

/*
 * Sistema visual (modo "produto"): uma família (Inter) para a interface, laranja só para
 * ações principais, seleção e estado; superfícies neutras; listas com divisórias em vez de cartões.
 */

const botaoBase =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const botaoVariantes = {
  // Laranja dos cartazes com texto azul-marinho: 7,3:1 (branco sobre #FF6600 dá só 2,9:1).
  primario: "bg-laranja-500 text-azul-950 hover:bg-laranja-400",
  secundario: "border border-borda bg-superficie text-texto hover:bg-fundo",
  contorno: "border border-laranja-300 text-laranja-700 hover:bg-laranja-50 dark:border-laranja-800 dark:text-laranja-300 dark:hover:bg-laranja-950/50",
  perigo: "bg-red-600 text-white hover:bg-red-700",
  fantasma: "text-suave hover:bg-fundo hover:text-texto",
} as const;

type Variante = keyof typeof botaoVariantes;

export function Botao({
  variante = "primario",
  className,
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={clsx(botaoBase, botaoVariantes[variante], className)} {...props} />;
}

export function BotaoLink({
  variante = "primario",
  className,
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={clsx(botaoBase, botaoVariantes[variante], className)} {...props} />;
}

/** Superfície agrupadora. Use com moderação: prefira listas com divisórias. */
export function Cartao({ className, ...props }: ComponentProps<"div">) {
  return <div className={clsx("rounded-2xl border border-borda bg-superficie p-5", className)} {...props} />;
}

export function Titulo({ children, subtitulo, acao }: { children: ReactNode; subtitulo?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance">{children}</h1>
        {subtitulo && <p className="mt-1 text-sm text-suave">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

/** Cabeçalho de seção: título à esquerda, detalhe opcional à direita, linha fina embaixo. */
export function CabecalhoSecao({ titulo, detalhe, className }: { titulo: ReactNode; detalhe?: ReactNode; className?: string }) {
  return (
    <h2 className={clsx("flex items-baseline justify-between gap-3 border-b border-borda pb-3 text-sm", className)}>
      <span className="font-semibold">{titulo}</span>
      {detalhe !== undefined && <span className="text-suave tabular-nums">{detalhe}</span>}
    </h2>
  );
}

export function Campo({ rotulo, dica, erro, children }: { rotulo: string; dica?: string; erro?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-[13px] font-medium text-texto/80">{rotulo}</span>
      {children}
      {erro ? (
        <span className="block text-xs text-red-700 dark:text-red-400">{erro}</span>
      ) : (
        dica && <span className="block text-xs text-suave">{dica}</span>
      )}
    </label>
  );
}

const entradaBase =
  "w-full rounded-xl border border-borda bg-fundo px-3.5 text-[15px] outline-none transition placeholder:text-suave focus:border-laranja-500 focus:bg-superficie focus:ring-2 focus:ring-laranja-500/35 focus-visible:outline-none disabled:opacity-60";

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input className={clsx(entradaBase, "h-11", className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={clsx(entradaBase, "min-h-24 py-2.5", className)} {...props} />;
}

export function Selecao({ className, ...props }: ComponentProps<"select">) {
  return <select className={clsx(entradaBase, "h-11 pr-8", className)} {...props} />;
}

const avisos = {
  erro: { classe: "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200", Icone: CircleAlert },
  sucesso: { classe: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200", Icone: CircleCheck },
  info: { classe: "bg-azul-50 text-azul-800 dark:bg-azul-950/60 dark:text-azul-200", Icone: Info },
} as const;

export function Aviso({ tipo = "erro", children }: { tipo?: keyof typeof avisos; children: ReactNode }) {
  const { classe, Icone } = avisos[tipo];
  return (
    <div role={tipo === "erro" ? "alert" : "status"} className={clsx("flex gap-2.5 rounded-xl px-3.5 py-3 text-sm", classe)}>
      <Icone className="mt-px size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export type Situacao = "pendente" | "em_analise" | "pago" | "nao_pago";

const situacoes: Record<Situacao, { rotulo: string; classe: string; ponto: string }> = {
  pendente: { rotulo: "Em aberto", classe: "bg-laranja-50 text-laranja-800 dark:bg-laranja-950/60 dark:text-laranja-200", ponto: "bg-laranja-500" },
  em_analise: { rotulo: "Em análise", classe: "bg-azul-50 text-azul-800 dark:bg-azul-950/70 dark:text-azul-200", ponto: "bg-azul-500" },
  pago: { rotulo: "Pago", classe: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200", ponto: "bg-emerald-500" },
  nao_pago: { rotulo: "Não pago", classe: "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-200", ponto: "bg-red-500" },
};

/** Cor do ponto de cada situação (legendas, calendário). */
export function pontoSituacao(situacao: Situacao) {
  return situacoes[situacao].ponto;
}

export function Selo({ situacao, className }: { situacao: Situacao; className?: string }) {
  const { rotulo, classe, ponto } = situacoes[situacao];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", classe, className)}>
      <span className={clsx("size-1.5 rounded-full", ponto)} aria-hidden />
      {rotulo}
    </span>
  );
}

/** Estado vazio: diz o que aconteceu e, se houver, o próximo passo. */
export function Vazio({ titulo, children }: { titulo: string; children?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="font-medium">{titulo}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-suave">{children}</div>}
    </div>
  );
}

/** Marca "ump·jóquei" em anel. A cor vem de `text-*` (padrão: herda do texto). Gira devagar; para se o sistema pedir menos movimento. */
export function Logo({ className, girando = false }: { className?: string; girando?: boolean }) {
  return (
    <span
      aria-hidden
      className={clsx("marca-anel size-10 shrink-0", girando && "animate-girar motion-reduce:animate-none", className)}
    />
  );
}
