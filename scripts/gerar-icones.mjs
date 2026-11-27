// Gera a marca "ump·jóquei" em anel (texto convertido em curvas) e os ícones do PWA.
// Uso: npm run icones
import { mkdir, readFile, writeFile } from "node:fs/promises";
import opentype from "opentype.js";
import sharp from "sharp";

const LARANJA = "#FF6600";
const fonte = opentype.parse((await readFile(new URL("./fontes/Montserrat-Bold.ttf", import.meta.url))).buffer);

/** Anel de texto centrado em (32, 32), raio de base `raio`, no viewBox 64×64. */
function anel({ raio = 19, tamanho = 10.6, texto = "ump·jóquei·ump·jóquei·" } = {}) {
  const larguras = [...texto].map((c) => fonte.getAdvanceWidth(c, tamanho));
  const total = larguras.reduce((a, b) => a + b, 0);
  const circunferencia = 2 * Math.PI * raio;
  const espaco = (circunferencia - total) / texto.length; // espaçamento extra para fechar o círculo
  let percorrido = 0;
  const caminhos = [...texto].map((c, i) => {
    const centro = percorrido + larguras[i] / 2;
    percorrido += larguras[i] + espaco;
    const graus = (centro / circunferencia) * 360 - 90; // começa no topo-esquerda, como nos cartazes
    const d = fonte.getPath(c, -larguras[i] / 2, 0, tamanho).toPathData(2);
    return `<path d="${d}" transform="translate(32 32) rotate(${graus.toFixed(2)}) translate(0 ${-raio})"/>`;
  });
  return caminhos.join("");
}

const ANEL = anel();

function svg({ px, fundo = LARANJA, raio = 14, escala = 1, cor = "#fff" }) {
  const t = (64 - 64 * escala) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 64 64">
  ${fundo ? `<rect width="64" height="64" rx="${raio}" fill="${fundo}"/>` : ""}
  <g transform="translate(${t} ${t}) scale(${escala})" fill="${cor}">${ANEL}</g>
</svg>`;
}

const png = (opcoes, destino) => sharp(Buffer.from(svg(opcoes))).png().toFile(destino);

await mkdir("public/icons", { recursive: true });
await Promise.all([
  png({ px: 192, escala: 0.92 }, "public/icons/icon-192.png"),
  png({ px: 512, escala: 0.92 }, "public/icons/icon-512.png"),
  png({ px: 512, raio: 0, escala: 0.74 }, "public/icons/maskable-512.png"),
  png({ px: 96, fundo: null, escala: 1.05 }, "public/icons/badge-96.png"),
  png({ px: 180, raio: 0, escala: 0.86 }, "src/app/apple-icon.png"),
  writeFile("src/app/icon.svg", svg({ px: 64, escala: 0.92 })),
  // Anel sem fundo: usado como máscara CSS, então pode ter qualquer cor no app.
  writeFile("public/icons/anel.svg", svg({ px: 64, fundo: null, cor: "#000" })),
]);
console.log("Ícones gerados.");
