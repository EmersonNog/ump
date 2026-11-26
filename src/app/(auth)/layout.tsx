import type { ReactNode } from "react";
import { Logo } from "@/components/ui";

export default function LayoutAuth({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-brand-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[55dvh] bg-[radial-gradient(ellipse_at_top,var(--color-brand-600),transparent_70%)]"
      />
      <header className="pt-safe relative px-6 pt-12 pb-8 text-center text-white">
        <Logo className="mx-auto size-16 shadow-lg shadow-black/30 ring-1 ring-white/10" />
        <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight">Mocidade Presbiteriana</h1>
        <p className="mt-1 text-sm text-brand-200">Mensalidades e eventos da UMP</p>
      </header>
      <main className="pb-safe relative flex-1 rounded-t-[2rem] bg-fundo px-5 pt-8 pb-10 sm:mx-auto sm:mb-12 sm:w-full sm:max-w-md sm:flex-none sm:rounded-[2rem] sm:pb-8 sm:shadow-2xl">
        <div className="animate-entrar">{children}</div>
      </main>
      <p className="relative pb-6 text-center text-xs text-brand-300 max-sm:hidden">
        “Ninguém despreze a tua mocidade” — 1 Timóteo 4.12
      </p>
    </div>
  );
}
