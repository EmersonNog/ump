import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CheckCircle2, Clock3, XCircle, CircleDashed } from "lucide-react";

export { clsx as cx };

const botaoBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 h-11 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none select-none";

const botaoVariantes = {
  primario: "bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700",
  ouro: "bg-ouro-400 text-brand-950 shadow-sm hover:bg-ouro-500",
  secundario: "bg-superficie text-texto border border-borda hover:bg-brand-50 dark:hover:bg-brand-950",
  perigo: "bg-red-600 text-white hover:bg-red-700",
  fantasma: "text-suave hover:text-texto hover:bg-brand-50 dark:hover:bg-brand-950",
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

export function Cartao({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={clsx("rounded-2xl border border-borda bg-superficie p-4 shadow-sm shadow-brand-950/[0.03]", className)}
      {...props}
    />
  );
}

export function Titulo({ children, subtitulo, acao }: { children: ReactNode; subtitulo?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">{children}</h1>
        {subtitulo && <p className="mt-1 text-sm text-suave">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Campo({ rotulo, dica, erro, children }: { rotulo: string; dica?: string; erro?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{rotulo}</span>
      {children}
      {erro ? <span className="block text-xs text-red-600">{erro}</span> : dica && <span className="block text-xs text-suave">{dica}</span>}
    </label>
  );
}

const entradaBase =
  "w-full rounded-xl border border-borda bg-superficie px-3.5 text-base sm:text-sm outline-none transition placeholder:text-suave/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export function Entrada({ className, ...props }: ComponentProps<"input">) {
  return <input className={clsx(entradaBase, "h-11", className)} {...props} />;
}

export function AreaTexto({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={clsx(entradaBase, "min-h-20 py-2.5", className)} {...props} />;
}

export function Selecao({ className, ...props }: ComponentProps<"select">) {
  return <select className={clsx(entradaBase, "h-11 pr-8", className)} {...props} />;
}

export function Aviso({ tipo = "erro", children }: { tipo?: "erro" | "sucesso" | "info"; children: ReactNode }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={clsx(
        "rounded-xl px-3.5 py-2.5 text-sm",
        tipo === "erro" && "bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200",
        tipo === "sucesso" && "bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200",
        tipo === "info" && "bg-ouro-300/25 text-ouro-600 dark:text-ouro-300",
      )}
    >
      {children}
    </div>
  );
}

export type Situacao = "pendente" | "em_analise" | "pago" | "nao_pago";

const situacoes: Record<Situacao, { rotulo: string; classe: string; Icone: typeof Clock3 }> = {
  pendente: { rotulo: "Em aberto", classe: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", Icone: CircleDashed },
  em_analise: { rotulo: "Em análise", classe: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200", Icone: Clock3 },
  pago: { rotulo: "Pago", classe: "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100", Icone: CheckCircle2 },
  nao_pago: { rotulo: "Não pago", classe: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200", Icone: XCircle },
};

export function Selo({ situacao, className }: { situacao: Situacao; className?: string }) {
  const { rotulo, classe, Icone } = situacoes[situacao];
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", classe, className)}>
      <Icone className="size-3.5" aria-hidden />
      {rotulo}
    </span>
  );
}

export function Vazio({ icone, titulo, children }: { icone: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-borda px-6 py-10 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300">
        {icone}
      </div>
      <p className="font-semibold">{titulo}</p>
      {children && <div className="mt-1 text-sm text-suave">{children}</div>}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icons/logo.svg" alt="" width={40} height={40} className={clsx("rounded-xl", className)} />
  );
}
