"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const ABAS = [
  { href: "/admin", rotulo: "Comprovantes" },
  { href: "/admin/cobrancas", rotulo: "Cobranças" },
  { href: "/admin/membros", rotulo: "Membros" },
];

export function AbasAdmin() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administração" className="-mx-4 mb-8 overflow-x-auto px-4 [scrollbar-width:none]">
      <ul className="flex min-w-max gap-6 border-b border-borda">
        {ABAS.map(({ href, rotulo }) => {
          const ativa = href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/pagamentos") : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativa ? "page" : undefined}
                className={cx(
                  "-mb-px inline-flex h-11 items-center border-b-2 text-sm font-medium whitespace-nowrap transition",
                  ativa ? "border-laranja-500 text-texto" : "border-transparent text-suave hover:text-texto",
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
