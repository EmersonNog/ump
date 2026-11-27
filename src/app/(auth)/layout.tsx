import type { ReactNode } from "react";
import { BotaoTema } from "@/components/tema";
import { LogoUmp } from "@/components/logo-ump";
import { Logo, cx } from "@/components/ui";

/** Setas empilhadas (">>>") como nos cartazes/referência. */
function Chevrons({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 64" fill="none" className={cx("stroke-current", className)} strokeWidth="5">
      {[4, 20, 36].map((y) => (
        <polyline key={y} points={`4,${y + 16} 20,${y} 36,${y + 16}`} />
      ))}
    </svg>
  );
}

function ZigueZague({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 40" fill="none" className={cx("stroke-current", className)} strokeWidth="4">
      {[6, 20, 34].map((y) => (
        <polyline
          key={y}
          points={`0,${y} 15,${y - 6} 30,${y} 45,${y - 6} 60,${y} 75,${y - 6} 90,${y} 105,${y - 6} 120,${y}`}
        />
      ))}
    </svg>
  );
}

function Pontos({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cx("bg-[radial-gradient(currentColor_1.6px,transparent_1.8px)] bg-size-[14px_14px]", className)}
    />
  );
}

export default function LayoutAuth({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-fundo px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:px-8 md:[@media(max-height:620px)]:pt-3 md:[@media(max-height:620px)]:pb-3">
      <BotaoTema className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] right-3 z-10 bg-superficie/80 backdrop-blur" />
      {/* Fundo geométrico em tons pastel */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -right-32 size-[34rem] rounded-full bg-laranja-100 dark:bg-laranja-950/40" />
        <div className="absolute top-1/3 -left-40 size-96 rounded-full border-[56px] border-azul-100 dark:border-azul-900/40" />
        <div className="absolute -bottom-48 left-1/4 size-[30rem] rounded-full bg-[color-mix(in_oklab,var(--color-pessego)_22%,transparent)] dark:bg-laranja-950/30" />
        <div className="absolute -right-24 -bottom-24 size-80 rounded-full border-[44px] border-laranja-200/70 dark:border-laranja-900/40" />
        <div className="absolute top-16 left-[18%] hidden size-5 rounded-full bg-azul-300 md:block dark:bg-azul-700" />
        <div className="absolute right-[12%] bottom-[22%] hidden size-8 rounded-full bg-laranja-300/60 md:block" />
        <Chevrons className="absolute top-10 left-8 hidden w-10 text-laranja-300 md:block dark:text-laranja-800" />
        <Chevrons className="absolute right-10 bottom-1/3 hidden w-12 text-azul-200 md:block dark:text-azul-800" />
        <ZigueZague className="absolute bottom-8 left-[40%] hidden w-32 text-laranja-200 md:block dark:text-laranja-900" />
        <Pontos className="absolute top-1/2 left-[8%] hidden size-32 text-azul-200 md:block dark:text-azul-800" />
        <Pontos className="absolute top-12 right-[22%] hidden size-28 text-laranja-300/70 md:block dark:text-laranja-900" />
      </div>

      <div className="flex w-full max-w-4xl flex-col items-center gap-4 md:gap-6 md:[@media(max-height:760px)]:gap-4">
        <div className="animate-entrar grid w-full overflow-hidden rounded-[1.75rem] border border-borda bg-superficie shadow-xl shadow-laranja-900/5 md:grid-cols-[1.05fr_1fr]">
          {/* Painel da marca */}
          <section className="malha-suave px-7 pt-7 pb-9 md:px-12 md:py-14 md:[@media(max-height:760px)]:py-9">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute -bottom-24 -left-20 size-64 rounded-full border-[36px] border-white/60 dark:border-white/5" />
              {/* Anel "ump·jóquei" dos cartazes girando ao fundo. */}
              <Logo girando className="absolute -top-14 -right-14 size-52 text-laranja-200/70 md:-top-24 md:-right-24 md:size-80 dark:text-laranja-800/35" />
              <Pontos className="absolute right-8 bottom-10 hidden size-24 text-laranja-300/70 md:block dark:text-laranja-900" />
              <Chevrons className="absolute top-1/2 right-6 hidden w-8 text-azul-200 md:block dark:text-azul-800" />
            </div>

            <div className="flex items-center gap-3.5">
              <LogoUmp className="h-20" />
              <span className="leading-tight">
                <span className="block font-display text-lg font-bold tracking-tight">UMP Jóquei</span>
                <span className="block text-xs text-suave">União de Mocidade Presbiteriana</span>
              </span>
            </div>

            <h1 className="mt-8 font-display text-4xl leading-[1.02] tracking-tight md:mt-16 md:text-5xl md:[@media(max-height:760px)]:mt-8">
              <span className="font-medium">Olá,</span>
              <br />
              <span className="font-black text-laranja-600 dark:text-laranja-400">boas-vindas!</span>
            </h1>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-suave">
              Mensalidades e eventos da Mocidade Presbiteriana do Jóquei, tudo num só lugar.
            </p>
          </section>

          {/* Formulário */}
          <section className="flex flex-col justify-center px-7 py-8 md:px-12 md:py-14 md:[@media(max-height:760px)]:py-9">{children}</section>
        </div>

        <p className="px-4 text-center text-xs text-balance text-suave sm:text-sm">
          “Ninguém despreze a tua mocidade; pelo contrário, torna-te padrão dos fiéis.” · 1 Tm 4.12 (ARA)
        </p>
      </div>
    </div>
  );
}
