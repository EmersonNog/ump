import type { Metadata } from "next";
import { QrPix } from "@/components/qr-pix";
import { Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { FormConfiguracoes } from "./form";

export const metadata: Metadata = { title: "Dados de pagamento" };

export default async function PaginaConfiguracoes() {
  const { supabase } = await exigirAdmin();
  const { data: config } = await supabase.from("configuracoes").select("*").single();

  return (
    <div className="mx-auto grid max-w-3xl gap-5 md:grid-cols-[1fr_240px]">
      <Cartao>
        <h2 className="font-semibold">Dados de pagamento</h2>
        <p className="mb-4 text-sm text-suave">Exibidos para os membros na tela inicial e ao informar um pagamento.</p>
        <FormConfiguracoes
          pixCopiaECola={config?.pix_copia_cola ?? ""}
          chavePix={config?.chave_pix ?? ""}
          favorecido={config?.favorecido ?? ""}
          instrucoes={config?.instrucoes ?? ""}
        />
      </Cartao>
      {config?.pix_copia_cola && (
        <Cartao className="self-start text-center">
          <p className="mb-3 text-sm font-semibold">QR Code atual</p>
          <QrPix
            codigo={config.pix_copia_cola}
            className="mx-auto w-48 overflow-hidden rounded-xl border border-borda bg-white p-1.5 [&_svg]:h-auto [&_svg]:w-full"
          />
          <p className="mt-3 text-xs text-suave">
            Em cada cobrança, o membro vê este QR Code com o valor já preenchido.
          </p>
        </Cartao>
      )}
    </div>
  );
}
