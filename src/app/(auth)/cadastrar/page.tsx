import type { Metadata } from "next";
import { FormCadastrar } from "../formularios";

export const metadata: Metadata = { title: "Cadastro" };

export default function PaginaCadastrar() {
  return (
    <>
      <h2 className="mb-1 font-serif text-2xl font-semibold">Criar conta</h2>
      <p className="mb-6 text-sm text-suave">Use seu nome completo para a diretoria identificar seus pagamentos.</p>
      <FormCadastrar />
    </>
  );
}
