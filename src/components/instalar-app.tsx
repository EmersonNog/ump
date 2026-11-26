"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";

type EventoInstalacao = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const CHAVE_DISPENSA = "ump:instalar-dispensado";

export function InstalarApp({ sempreVisivel = false }: { sempreVisivel?: boolean }) {
  const [evento, setEvento] = useState<EventoInstalacao | null>(null);
  const [ios, setIos] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true);
    if (instalado) return;
    if (!sempreVisivel && localStorage.getItem(CHAVE_DISPENSA)) return;

    const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    // Estado derivado do navegador; só existe no cliente.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIos(ehIos);
    if (ehIos) setVisivel(true);

    function aoPoderInstalar(e: Event) {
      e.preventDefault();
      setEvento(e as EventoInstalacao); // evento não tipado no DOM lib
      setVisivel(true);
    }
    function aoInstalar() {
      setVisivel(false);
    }
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, [sempreVisivel]);

  if (!visivel) return null;

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    if (outcome === "accepted") setVisivel(false);
    setEvento(null);
  }

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSA, "1");
    setVisivel(false);
  }

  return (
    <div className="animate-entrar relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-4 pr-10 text-white shadow-lg shadow-brand-900/20">
      {!sempreVisivel && (
        <button type="button" onClick={dispensar} aria-label="Dispensar" className="absolute top-2 right-2 rounded-full p-1.5 text-brand-200 hover:bg-white/10">
          <X className="size-4" />
        </button>
      )}
      <p className="font-semibold">Instale o app da UMP</p>
      {ios ? (
        <p className="mt-1 text-sm text-brand-100">
          Toque em <Share className="inline size-4 align-text-bottom text-ouro-300" aria-label="Compartilhar" /> e depois em{" "}
          <span className="whitespace-nowrap font-semibold">
            <SquarePlus className="inline size-4 align-text-bottom text-ouro-300" aria-hidden /> Adicionar à Tela de Início
          </span>
          . Assim você também recebe notificações.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-brand-100">Acesso rápido pela tela inicial, em tela cheia, com notificações.</p>
          <button
            type="button"
            onClick={instalar}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-ouro-400 px-4 text-sm font-bold text-brand-950 active:scale-95"
          >
            <Download className="size-4" aria-hidden /> Instalar
          </button>
        </>
      )}
    </div>
  );
}
