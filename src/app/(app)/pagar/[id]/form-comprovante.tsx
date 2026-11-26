"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Camera, FileText, Loader2, RefreshCcw } from "lucide-react";
import { Aviso, Botao, Campo, Entrada, AreaTexto } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { registrarPagamento } from "../../actions";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const LADO_MAXIMO = 1800;

/** Reduz fotos grandes do celular para JPEG (~300–600 KB). PDFs e formatos não decodificáveis seguem como estão. */
async function otimizarImagem(arquivo: File): Promise<File> {
  if (!arquivo.type.startsWith("image/") || arquivo.size < 600 * 1024) return arquivo;
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // new Promise em vez de Promise.withResolvers: compatível com iPhones em iOS < 17.4.
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.82));
    if (!blob || blob.size >= arquivo.size) return arquivo;
    return new File([blob], arquivo.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return arquivo;
  }
}

export function FormComprovante({
  cobrancaId,
  membroId,
  valorSugerido,
  hoje,
}: {
  cobrancaId: string;
  membroId: string;
  valorSugerido: string;
  hoje: string;
}) {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    e.target.value = "";
    if (!original) return;
    setErro(null);

    const otimizado = await otimizarImagem(original);
    if (otimizado.size > TAMANHO_MAXIMO) {
      setErro("Arquivo muito grande (máx. 5 MB). Tire um print do comprovante e tente de novo.");
      return;
    }
    if (previa) URL.revokeObjectURL(previa);
    setArquivo(otimizado);
    setPrevia(otimizado.type.startsWith("image/") ? URL.createObjectURL(otimizado) : null);
  }

  function enviar(form: FormData) {
    if (!arquivo) {
      setErro("Anexe o comprovante do pagamento.");
      return;
    }
    setErro(null);

    iniciar(async () => {
      setEtapa("Enviando comprovante…");
      const supabase = createClient();
      const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";
      const caminho = `${membroId}/${crypto.randomUUID()}.${extensao}`;

      const { error: erroUpload } = await supabase.storage
        .from("comprovantes")
        .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (erroUpload) {
        setEtapa(null);
        setErro("Falha ao enviar o arquivo. Verifique sua conexão e o formato (imagem ou PDF).");
        return;
      }

      setEtapa("Registrando pagamento…");
      const resultado = await registrarPagamento({
        cobrancaId,
        valor: String(form.get("valor") ?? ""),
        dataPagamento: String(form.get("data") ?? ""),
        observacao: String(form.get("observacao") ?? ""),
        comprovantePath: caminho,
      });

      if (resultado.erro) {
        setEtapa(null);
        setErro(resultado.erro);
        return;
      }
      navigator.vibrate?.([40, 30, 40]);
      router.replace("/?enviado=1");
    });
  }

  const enviando = etapa !== null;

  return (
    <form action={enviar} className="space-y-4">
      {erro && <Aviso>{erro}</Aviso>}

      <label
        className={
          "relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition " +
          (arquivo ? "border-brand-400 bg-superficie" : "border-borda bg-superficie hover:border-brand-300")
        }
      >
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={escolher}
          disabled={enviando}
          aria-label="Comprovante"
        />
        {previa ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previa} alt="Prévia do comprovante" className="max-h-80 w-full object-contain" />
            <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
              <RefreshCcw className="size-3" aria-hidden /> Trocar
            </span>
          </>
        ) : arquivo ? (
          <span className="flex flex-col items-center gap-2 p-6 text-center">
            <FileText className="size-10 text-brand-500" aria-hidden />
            <span className="text-sm font-semibold break-all">{arquivo.name}</span>
            <span className="text-xs text-suave">Toque para trocar</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2 p-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              <Camera className="size-7" aria-hidden />
            </span>
            <span className="font-semibold">Anexar comprovante</span>
            <span className="text-xs text-suave">Foto, print ou PDF · até 5 MB</span>
          </span>
        )}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Campo rotulo="Valor pago">
          <Entrada name="valor" inputMode="decimal" defaultValue={valorSugerido} required disabled={enviando} />
        </Campo>
        <Campo rotulo="Data do pagamento">
          <Entrada name="data" type="date" defaultValue={hoje} max={hoje} required disabled={enviando} />
        </Campo>
      </div>

      <Campo rotulo="Observação" dica="Opcional. Ex.: pago junto com a mensalidade de outro mês.">
        <AreaTexto name="observacao" maxLength={500} disabled={enviando} />
      </Campo>

      <Botao type="submit" className="w-full" disabled={enviando}>
        {enviando && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {etapa ?? "Enviar comprovante"}
      </Botao>
    </form>
  );
}
