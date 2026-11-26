import type { Metadata } from "next";
import { FormRecuperar } from "../formularios";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function PaginaRecuperar() {
  return (
    <>
      <h2 className="mb-1 font-serif text-2xl font-semibold">Recuperar senha</h2>
      <p className="mb-6 text-sm text-suave">Enviaremos um link para você criar uma nova senha.</p>
      <FormRecuperar />
    </>
  );
}
