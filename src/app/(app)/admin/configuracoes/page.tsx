import type { Metadata } from "next";
import { Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { FormConfiguracoes } from "./form";

export const metadata: Metadata = { title: "Dados de pagamento" };

export default async function PaginaConfiguracoes() {
  const { supabase } = await exigirAdmin();
  const { data: config } = await supabase.from("configuracoes").select("*").single();

  return (
    <Cartao className="mx-auto max-w-lg">
      <h2 className="font-semibold">Dados de pagamento</h2>
      <p className="mb-4 text-sm text-suave">Exibidos para os membros na tela inicial e ao informar um pagamento.</p>
      <FormConfiguracoes
        chavePix={config?.chave_pix ?? ""}
        favorecido={config?.favorecido ?? ""}
        instrucoes={config?.instrucoes ?? ""}
      />
    </Cartao>
  );
}
