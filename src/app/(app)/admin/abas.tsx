"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const ABAS = [
  { href: "/admin", rotulo: "Comprovantes" },
  { href: "/admin/cobrancas", rotulo: "Cobranças" },
  { href: "/admin/membros", rotulo: "Membros" },
  { href: "/admin/configuracoes", rotulo: "PIX" },
];

export function AbasAdmin() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administração" className="-mx-4 mb-6 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex w-max gap-1 rounded-2xl border border-borda bg-superficie p-1">
        {ABAS.map(({ href, rotulo }) => {
          const ativa = href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/pagamentos") : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativa ? "page" : undefined}
                className={cx(
                  "inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium whitespace-nowrap transition",
                  ativa ? "bg-brand-600 text-white shadow-sm" : "text-suave hover:text-texto",
                )}
              >
                {rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
