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

export type DadosPix = { chave: string | null; nome: string | null; cidade: string | null };

/** Valida o código e extrai chave, nome e cidade. Retorna null se o código for inválido. */
export function lerPixCopiaECola(codigo: string): DadosPix | null {
  const texto = codigo.trim();
  if (!texto.startsWith("000201") || texto.length < 30) return null;
  if (comCrc(texto.slice(0, -8)) !== texto) return null;

  const campos = lerCampos(texto);
  if (!campos) return null;
  const conta = campos.find((c) => c.id === "26");
  const subcampos = conta ? lerCampos(conta.valor) : null;
  return {
    chave: subcampos?.find((c) => c.id === "01")?.valor ?? null,
    nome: campos.find((c) => c.id === "59")?.valor ?? null,
    cidade: campos.find((c) => c.id === "60")?.valor ?? null,
  };
}

/**
 * Gera o mesmo Pix com o valor já preenchido (campo 54), recalculando o CRC.
 * Só altera Pix estático (com chave). Pix dinâmico (URL do banco) volta sem alteração.
 */
export function pixComValor(codigo: string, valor: number): string {
  const texto = codigo.trim();
  const campos = lerPixCopiaECola(texto) ? lerCampos(texto) : null;
  if (!campos) return texto;
  const conta = campos.find((c) => c.id === "26");
  if (!conta || !lerCampos(conta.valor)?.some((c) => c.id === "01")) return texto;

  const sem = campos.filter((c) => c.id !== "54" && c.id !== "63");
  const posicao = sem.findIndex((c) => Number(c.id) > 54);
  sem.splice(posicao === -1 ? sem.length : posicao, 0, { id: "54", valor: valor.toFixed(2) });
  return comCrc(montar(sem));
}
