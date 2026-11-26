import type { ReactNode } from "react";
import Link from "next/link";
import { Navegacao } from "@/components/navegacao";
import { Logo } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";

export default async function LayoutApp({ children }: { children: ReactNode }) {
  const { supabase, perfil } = await exigirSessao();
  const admin = perfil.papel === "admin";

  let pendentes = 0;
  if (admin) {
    const { count } = await supabase
      .from("pagamentos")
      .select("id", { count: "exact", head: true })
      .eq("status", "em_analise");
    pendentes = count ?? 0;
  }

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-20 bg-brand-800/95 text-white shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="size-8 rounded-lg" />
            <span className="leading-tight">
              <span className="block font-serif text-base font-semibold">UMP</span>
              <span className="block text-[11px] text-brand-200">Olá, {perfil.nome.split(" ")[0]}</span>
            </span>
          </Link>
          <Navegacao admin={admin} pendentes={pendentes} variante="topo" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-12">{children}</main>
      <Navegacao admin={admin} pendentes={pendentes} variante="inferior" />
    </div>
  );
}
