"use client";

import { useEffect } from "react";

export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const url = process.env.NODE_ENV === "development" ? "/sw.js?dev" : "/sw.js";
    navigator.serviceWorker.register(url, { scope: "/", updateViaCache: "none" }).catch((erro) => {
      console.error("Falha ao registrar o service worker", erro);
    });
  }, []);

  return null;
}
