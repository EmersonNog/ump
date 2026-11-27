import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "UMP Jóquei",
    short_name: "UMP Jóquei",
    description: "Informe mensalidades e pagamentos de eventos da UMP Jóquei.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f5f8",
    theme_color: "#f4f5f8",
    categories: ["finance", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Minhas cobranças", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Histórico", url: "/historico", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
