import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

export const metadata: Metadata = { title: "Sem conexão" };
export const dynamic = "force-static";

export default function PaginaOffline() {
  return (
    <main className="pt-safe pb-safe grid min-h-dvh place-items-center bg-brand-900 px-6 text-center text-white">
      <div>
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/10">
          <WifiOff className="size-8 text-ouro-300" aria-hidden />
        </div>
        <h1 className="mt-5 font-serif text-2xl font-semibold">Você está sem internet</h1>
        <p className="mt-2 max-w-xs text-sm text-brand-200">
          Assim que a conexão voltar, seus pagamentos e comprovantes aparecem aqui normalmente.
        </p>
        {/* <a> e não <Link>: força navegação completa pela rede ao reconectar. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-ouro-400 px-5 text-sm font-semibold text-brand-950">
          Tentar novamente
        </a>
      </div>
    </main>
  );
}
