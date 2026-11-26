"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, Home, ShieldCheck, UserRound } from "lucide-react";
import { cx } from "./ui";

type Item = { href: string; rotulo: string; Icone: typeof Home; contador?: number };

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" || pathname.startsWith("/pagar") : pathname.startsWith(href);
}

/** `topo`: links no cabeçalho (desktop). `inferior`: barra fixa estilo app (celular), fora do cabeçalho
 *  porque o backdrop-filter do cabeçalho prenderia o `position: fixed`. */
export function Navegacao({
  admin,
  pendentes,
  variante,
}: {
  admin: boolean;
  pendentes: number;
  variante: "topo" | "inferior";
}) {
  const pathname = usePathname();
  const itens: Item[] = [
    { href: "/", rotulo: "Início", Icone: Home },
    { href: "/historico", rotulo: "Histórico", Icone: History },
    ...(admin ? [{ href: "/admin", rotulo: "Admin", Icone: ShieldCheck, contador: pendentes }] : []),
    { href: "/perfil", rotulo: "Perfil", Icone: UserRound },
  ];

  if (variante === "topo") {
    return (
      <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
        {itens.map(({ href, rotulo, Icone, contador }) => (
          <Link
            key={href}
            href={href}
            className={cx(
              "relative inline-flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition",
              ativo(pathname, href) ? "bg-white/15 text-white" : "text-brand-100 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
            {!!contador && (
              <span className="rounded-full bg-ouro-400 px-1.5 text-xs font-bold text-brand-950">{contador}</span>
            )}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie/90 backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {itens.map(({ href, rotulo, Icone, contador }) => {
          const selecionado = ativo(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={selecionado ? "page" : undefined}
                className={cx(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition",
                  selecionado ? "text-brand-600 dark:text-brand-300" : "text-suave",
                )}
              >
                <span
                  className={cx(
                    "relative grid h-8 w-14 place-items-center rounded-full transition",
                    selecionado && "bg-brand-100 dark:bg-brand-900",
                  )}
                >
                  <Icone className="size-5" aria-hidden />
                  {!!contador && (
                    <span className="absolute -top-1 right-1.5 min-w-5 rounded-full bg-ouro-400 px-1 text-center text-[10px] leading-5 font-bold text-brand-950">
                      {contador > 99 ? "99+" : contador}
                    </span>
                  )}
                </span>
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
