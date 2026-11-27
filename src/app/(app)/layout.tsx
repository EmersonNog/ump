import type { ReactNode } from "react";
import Link from "next/link";
import { Navegacao } from "@/components/navegacao";
import { BotaoTema } from "@/components/tema";
import { LogoUmp } from "@/components/logo-ump";
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
      <header className="pt-safe sticky top-0 z-20 border-b border-borda bg-fundo/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2.5" aria-label="UMP Jóquei, início">
            <LogoUmp className="h-10" />
            <span className="leading-tight">
              <span className="block font-display text-base font-bold tracking-tight">UMP Jóquei</span>
              <span className="hidden text-[11px] text-suave sm:block">União de Mocidade Presbiteriana</span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Navegacao admin={admin} pendentes={pendentes} variante="topo" />
            <BotaoTema />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-12">{children}</main>
      <Navegacao admin={admin} pendentes={pendentes} variante="inferior" />
    </div>
  );
}
