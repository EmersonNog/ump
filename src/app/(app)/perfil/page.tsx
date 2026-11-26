import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { sair } from "@/app/(auth)/actions";
import { InstalarApp } from "@/components/instalar-app";
import { Notificacoes } from "@/components/notificacoes";
import { Botao, Cartao, Titulo } from "@/components/ui";
import { exigirSessao } from "@/lib/auth";
import { FormPerfil } from "./form-perfil";

export const metadata: Metadata = { title: "Perfil" };

export default async function PaginaPerfil() {
  const { perfil } = await exigirSessao();

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <Titulo subtitulo={perfil.email}>Meu perfil</Titulo>

      <InstalarApp sempreVisivel />

      <Cartao>
        <Notificacoes />
      </Cartao>

      <Cartao>
        <h2 className="mb-4 font-semibold">Dados pessoais</h2>
        <FormPerfil nome={perfil.nome} telefone={perfil.telefone ?? ""} />
      </Cartao>

      <form action={sair}>
        <Botao variante="secundario" className="w-full text-red-600 dark:text-red-400">
          <LogOut className="size-4" aria-hidden /> Sair da conta
        </Botao>
      </form>

      <p className="pt-2 text-center font-serif text-sm text-suave italic">
        “Alegrai-vos sempre no Senhor” — Filipenses 4.4
      </p>
    </div>
  );
}
