import type { Metadata } from "next";
import { FormNovaSenha } from "../formularios";

export const metadata: Metadata = { title: "Nova senha" };

export default function PaginaNovaSenha() {
  return (
    <>
      <h2 className="mb-6 text-xl font-semibold tracking-tight">Crie uma nova senha</h2>
      <FormNovaSenha />
    </>
  );
}
