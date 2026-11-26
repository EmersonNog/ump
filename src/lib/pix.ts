/**
 * Pix "copia e cola" (BR Code, padrão EMV QRCPS do Banco Central).
 * Formato: sequência de campos ID(2) + TAMANHO(2) + VALOR, terminando em 6304 + CRC16.
 */

type Campo = { id: string; valor: string };

function lerCampos(texto: string): Campo[] | null {
  const campos: Campo[] = [];
  let i = 0;
  while (i < texto.length) {
    const id = texto.slice(i, i + 2);
    const tamanho = Number(texto.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || !Number.isInteger(tamanho) || i + 4 + tamanho > texto.length) return null;
    campos.push({ id, valor: texto.slice(i + 4, i + 4 + tamanho) });
    i += 4 + tamanho;
  }
  return campos;
}

const montar = (campos: Campo[]) =>
  campos.map(({ id, valor }) => id + String(valor.length).padStart(2, "0") + valor).join("");

/** CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido pelo BR Code. */
function crc16(texto: string) {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8;
    for (let b = 0; b < 8; b++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const comCrc = (semCrc: string) => `${semCrc}6304${crc16(`${semCrc}6304`)}`;

/** Pix fixo da UMP (QR Code da InfinitePay). Para trocar de conta, substitua este código e publique de novo. */
const PIX_UMP =
  "00020101021126330014BR.GOV.BCB.PIX0111077531093085204000053039865802BR5925RIAN FILIPE ARAUJO SOARES6008TERESINA62070503***63044127";

/** Valida o código uma vez ao carregar: um erro de digitação derruba o build em vez de gerar Pix inválido. */
function lerPixUmp() {
  const valido = PIX_UMP.startsWith("000201") && comCrc(PIX_UMP.slice(0, -8)) === PIX_UMP;
  const campos = valido ? lerCampos(PIX_UMP) : null;
  const conta = campos?.find((c) => c.id === "26");
  const chave = conta ? lerCampos(conta.valor)?.find((c) => c.id === "01")?.valor : undefined;
  const favorecido = campos?.find((c) => c.id === "59")?.valor;
  if (!campos || !chave || !favorecido) throw new Error("PIX_UMP inválido: confira o código copia e cola.");
  return { campos, chave, favorecido };
}

const { campos, chave, favorecido } = lerPixUmp();

/** Chave e favorecido exibidos ao membro, extraídos do próprio código. */
export const pixUmp = { chave, favorecido };

/** Pix copia e cola da UMP com o valor já preenchido (campo 54) e o CRC recalculado. */
export function pixComValor(valor: number): string {
  const sem = campos.filter((c) => c.id !== "54" && c.id !== "63");
  const posicao = sem.findIndex((c) => Number(c.id) > 54);
  sem.splice(posicao === -1 ? sem.length : posicao, 0, { id: "54", valor: valor.toFixed(2) });
  return comCrc(montar(sem));
}
