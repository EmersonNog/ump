import { Logo } from "@/components/ui";

/** Enquanto uma tela carrega, o anel "ump·jóquei" gira (mais rápido que o normal). */
export default function Carregando() {
  return (
    <div role="status" className="grid min-h-[50dvh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Logo girando className="size-14 text-laranja-500 [animation-duration:2.4s]" />
        <span className="text-sm text-suave">Carregando…</span>
      </div>
    </div>
  );
}
