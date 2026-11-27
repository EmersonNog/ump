import { LogoUmp } from "@/components/logo-ump";
import { BotaoLink } from "@/components/ui";

export default function NaoEncontrado() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <LogoUmp className="mx-auto h-24" />
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Página não encontrada</h1>
        <p className="mt-1 text-sm text-suave">O endereço pode ter mudado ou a cobrança foi encerrada.</p>
        <BotaoLink href="/" className="mt-6">
          Ir para o início
        </BotaoLink>
      </div>
    </main>
  );
}
