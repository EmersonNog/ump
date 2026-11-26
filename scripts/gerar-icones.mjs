// Gera os ícones do PWA a partir do desenho da sarça ardente.
// Uso: node scripts/gerar-icones.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const CHAMA_EXTERNA =
  "M32 7c4 10 14 15 14 27 0 9-6 16-14 16s-14-7-14-16c0-7 4-11 7-15 0 6 3 9 5 9-2-8 0-14 2-21z";
const CHAMA_INTERNA =
  "M32 25c3 5 7 8 7 13 0 5-3 9-7 9s-7-4-7-8c0-4 3-6 4-9 1 3 2 4 3 4-1-3-1-6 0-9z";
const ARBUSTO = "M13 50c6-4 12 2 19-1 7 3 13-3 19 1-4 5-11 7-19 7s-15-2-19-7z";

/** Desenho em viewBox 64×64. `escala` encolhe o símbolo para a zona segura (maskable). */
function svg({ tamanho, fundo = true, raio = 14, escala = 1, monocromatico = false }) {
  const t = (64 - 64 * escala) / 2;
  const desenho = monocromatico
    ? `<path d="${CHAMA_EXTERNA}" fill="#fff"/><path d="${ARBUSTO}" fill="#fff"/>`
    : `<path d="${CHAMA_EXTERNA}" fill="url(#chama)"/>
       <path d="${CHAMA_INTERNA}" fill="#fff6d8" opacity=".9"/>
       <path d="${ARBUSTO}" fill="#74b58e"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1d6b45"/><stop offset="1" stop-color="#0b3220"/>
    </linearGradient>
    <linearGradient id="chama" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0d48a"/><stop offset="1" stop-color="#c99a2e"/>
    </linearGradient>
  </defs>
  ${fundo ? `<rect width="64" height="64" rx="${raio}" fill="url(#fundo)"/>` : ""}
  <g transform="translate(${t} ${t}) scale(${escala})">${desenho}</g>
</svg>`;
}

const png = (opcoes, destino) => sharp(Buffer.from(svg(opcoes))).png().toFile(destino);

await mkdir("public/icons", { recursive: true });
await Promise.all([
  png({ tamanho: 192 }, "public/icons/icon-192.png"),
  png({ tamanho: 512 }, "public/icons/icon-512.png"),
  png({ tamanho: 512, raio: 0, escala: 0.72 }, "public/icons/maskable-512.png"),
  png({ tamanho: 96, fundo: false, monocromatico: true }, "public/icons/badge-96.png"),
  png({ tamanho: 180, raio: 0, escala: 0.86 }, "src/app/apple-icon.png"),
  writeFile("src/app/icon.svg", svg({ tamanho: 64 })),
  writeFile("public/icons/logo.svg", svg({ tamanho: 64 })),
]);
console.log("Ícones gerados.");
