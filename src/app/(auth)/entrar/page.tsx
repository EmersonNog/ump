import type { Metadata } from "next";
import { FormEntrar } from "../formularios";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaEntrar({ searchParams }: PageProps<"/entrar">) {
  const { voltar, erro } = await searchParams;
  return (
    <>
      <h2 className="mb-6 font-serif text-2xl font-semibold">Bem-vindo de volta</h2>
      <FormEntrar
        voltar={typeof voltar === "string" ? voltar : "/"}
        aviso={erro === "link" ? "O link expirou ou já foi usado. Solicite um novo." : undefined}
      />
    </>
  );
}
