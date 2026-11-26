const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export function moeda(valor: number | string) {
  return brl.format(Number(valor));
}

/** Datas "YYYY-MM-DD" do banco (sem fuso). */
export function data(iso: string) {
  return dataCurta.format(new Date(`${iso}T00:00:00Z`));
}

export function dataHoraCurta(iso: string) {
  return dataHora.format(new Date(iso));
}

export function competencia(iso: string) {
  const texto = mesAno.format(new Date(`${iso}T00:00:00Z`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Hoje em São Paulo, "YYYY-MM-DD". */
export function hojeISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

export function primeiroDiaDoMes(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

/** "150,50" | "150.50" | "R$ 1.234,56" → 1234.56 */
export function lerValor(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, "");
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}
