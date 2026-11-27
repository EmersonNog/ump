"use client";

import { Share, Smartphone, SquarePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Botao, cx } from "./ui";

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
    <div
      className={cx(
        "flex items-center gap-3",
        sempreVisivel ? "py-4" : "animate-entrar rounded-2xl border border-borda bg-superficie p-4",
      )}
    >
      <Smartphone className="size-5 shrink-0 text-suave" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">Instale o app</p>
        {ios ? (
          <p className="mt-0.5 text-sm text-suave">
            Toque em <Share className="inline size-4 align-text-bottom" aria-label="Compartilhar" /> e depois em{" "}
            <span className="font-medium whitespace-nowrap text-texto">
              <SquarePlus className="inline size-4 align-text-bottom" aria-hidden /> Adicionar à Tela de Início
            </span>
            . Assim você também recebe notificações.
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-suave">Acesso rápido e notificações.</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!ios && (
          <Botao type="button" variante="secundario" onClick={instalar}>
            Instalar
          </Botao>
        )}
        {!sempreVisivel && (
          <button
            type="button"
            onClick={dispensar}
            aria-label="Dispensar"
            className="grid size-9 place-items-center rounded-full text-suave transition hover:bg-fundo hover:text-texto"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
