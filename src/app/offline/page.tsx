import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { LogoUmp } from "@/components/logo-ump";

export const metadata: Metadata = { title: "Sem conexão" };
export const dynamic = "force-static";

export default function PaginaOffline() {
  return (
    <main className="malha-suave pt-safe pb-safe grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <LogoUmp className="mx-auto h-28" />
        <WifiOff className="mx-auto mt-6 size-6 text-suave" aria-hidden />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Você está sem internet</h1>
        <p className="mx-auto mt-2 max-w-xs text-sm text-suave">
          Assim que a conexão voltar, seus pagamentos e comprovantes aparecem aqui normalmente.
        </p>
        {/* <a> e não <Link>: força navegação completa pela rede ao reconectar. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-laranja-500 px-5 text-sm font-semibold text-azul-950 hover:bg-laranja-400"
        >
          Tentar novamente
        </a>
      </div>
    </main>
  );
}
