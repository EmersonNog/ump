import type { Metadata } from "next";
import { LogOut, SunMoon } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import { InstalarApp } from "@/components/instalar-app";
import { Notificacoes } from "@/components/notificacoes";
import { EscolhaTema } from "@/components/tema";
import { CabecalhoSecao } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { FormPerfil } from "./form-perfil";

export const metadata: Metadata = { title: "Perfil" };

export default async function PaginaPerfil() {
  const { perfil } = await exigirSessao();

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-8 flex items-center gap-4">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full border border-borda bg-superficie text-lg font-semibold text-suave"
        >
          {perfil.nome.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold tracking-tight">{perfil.nome}</h1>
          <p className="truncate text-sm text-suave">{perfil.email}</p>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <CabecalhoSecao titulo="Preferências" />
          <div className="divide-y divide-borda">
            <div className="py-4">
              <Notificacoes />
            </div>
            <div className="py-4">
              <div className="flex items-center gap-3">
                <SunMoon className="size-5 shrink-0 text-suave" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Aparência</p>
                  <p className="text-sm text-suave">“Automático” segue o tema claro/escuro do celular.</p>
                </div>
              </div>
              <div className="mt-3">
                <EscolhaTema />
              </div>
            </div>
            <InstalarApp sempreVisivel />
          </div>
        </section>

        <section>
          <CabecalhoSecao titulo="Dados pessoais" />
          <div className="pt-5">
            <FormPerfil nome={perfil.nome} telefone={perfil.telefone ?? ""} />
          </div>
        </section>

        <form action={sair} className="border-t border-borda">
          <button
            type="submit"
            className="flex h-12 w-full items-center gap-3 text-sm font-medium text-red-700 transition hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            <LogOut className="size-5 shrink-0" aria-hidden /> Sair da conta
          </button>
        </form>
      </div>

      <p className="mt-10 text-center text-xs text-suave">“Alegrai-vos sempre no Senhor; outra vez digo: alegrai-vos.” · Fp 4.4 (ARA)</p>
    </div>
  );
}
