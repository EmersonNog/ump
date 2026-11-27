"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { removerInscricaoPush, salvarInscricaoPush } from "@/app/(app)/actions";
import { Aviso } from "./ui";

const CHAVE_PUBLICA = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function base64UrlParaBytes(base64: string) {
  const preenchido = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(preenchido), (c) => c.charCodeAt(0));
}

type Estado = "carregando" | "indisponivel" | "precisa-instalar" | "bloqueado" | "ativo" | "inativo";

export function Notificacoes() {
  const [estado, setEstado] = useState<Estado>("carregando");
  const [ocupado, setOcupado] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "erro" | "sucesso"; texto: string } | null>(null);

  useEffect(() => {
    async function verificar(): Promise<Estado> {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const instalado = window.matchMedia("(display-mode: standalone)").matches;
      if (!CHAVE_PUBLICA) return "indisponivel";
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return ios && !instalado ? "precisa-instalar" : "indisponivel";
      }
      if (Notification.permission === "denied") return "bloqueado";
      const registro = await navigator.serviceWorker.ready;
      return (await registro.pushManager.getSubscription()) ? "ativo" : "inativo";
    }
    verificar().then(setEstado);
  }, []);

  async function ativar() {
    setOcupado(true);
    setMensagem(null);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado(permissao === "denied" ? "bloqueado" : "inativo");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlParaBytes(CHAVE_PUBLICA),
      });
      const json = inscricao.toJSON();
      const resultado = await salvarInscricaoPush({
        endpoint: inscricao.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      if (resultado.erro) {
        await inscricao.unsubscribe();
        setMensagem({ tipo: "erro", texto: resultado.erro });
        return;
      }
      setEstado("ativo");
      setMensagem({ tipo: "sucesso", texto: "Pronto! Você receberá avisos neste aparelho." });
    } catch (erro) {
      console.error(erro);
      setMensagem({ tipo: "erro", texto: "Não foi possível ativar as notificações neste navegador." });
    } finally {
      setOcupado(false);
    }
  }

  async function desativar() {
    setOcupado(true);
    setMensagem(null);
    try {
      const registro = await navigator.serviceWorker.ready;
      const inscricao = await registro.pushManager.getSubscription();
      if (inscricao) {
        await removerInscricaoPush(inscricao.endpoint);
        await inscricao.unsubscribe();
      }
      setEstado("inativo");
    } finally {
      setOcupado(false);
    }
  }

  const textos: Record<Estado, string> = {
    carregando: "Verificando…",
    indisponivel: "Este navegador não suporta notificações.",
    "precisa-instalar": "No iPhone, instale o app na Tela de Início para receber notificações.",
    bloqueado: "Notificações bloqueadas. Libere nas configurações do navegador para este site.",
    ativo: "Ativas neste aparelho.",
    inativo: "Receba avisos quando seu pagamento for conferido e quando houver novas cobranças.",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {estado === "ativo" ? (
          <Bell className="size-5 shrink-0 text-suave" aria-hidden />
        ) : (
          <BellOff className="size-5 shrink-0 text-suave" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium">Notificações</p>
          <p className="text-sm text-suave">{textos[estado]}</p>
        </div>
        {(estado === "ativo" || estado === "inativo") && (
          <button
            type="button"
            role="switch"
            aria-checked={estado === "ativo"}
            aria-label="Notificações"
            disabled={ocupado}
            onClick={estado === "ativo" ? desativar : ativar}
            className={
              "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 " +
              (estado === "ativo" ? "bg-laranja-500" : "bg-slate-300 dark:bg-slate-700")
            }
          >
            <span
              className={
                "absolute top-0.5 grid size-6 place-items-center rounded-full bg-white shadow transition-all " +
                (estado === "ativo" ? "left-[1.375rem]" : "left-0.5")
              }
            >
              {ocupado && <Loader2 className="size-3.5 animate-spin text-suave" aria-hidden />}
            </span>
          </button>
        )}
      </div>
      {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}
    </div>
  );
}
