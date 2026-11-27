import type { Metadata } from "next";
import { FormCadastrar } from "../formularios";

export const metadata: Metadata = { title: "Cadastro" };

export default function PaginaCadastrar() {
  return (
    <>
      <h2 className="mb-1 text-xl font-semibold tracking-tight">Criar conta</h2>
      <p className="mb-6 text-sm text-suave">Use seu nome completo para a diretoria identificar seus pagamentos.</p>
      <FormCadastrar />
    </>
  );
}
