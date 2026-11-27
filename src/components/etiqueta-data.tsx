import type { Cobranca } from "@/lib/cobrancas";
import { cx } from "./ui";

const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

/**
 * Data compacta à esquerda das linhas de cobrança.
 * Evento: mês pequeno (laranja) + dia grande. Mensalidade: ano pequeno (azul) + mês grande,
 * para não confundir "26" (dia) com 2026 (ano).
 */
export function EtiquetaData({ cobranca }: { cobranca: Pick<Cobranca, "tipo" | "competencia" | "vencimento"> }) {
  const referencia = cobranca.tipo === "mensalidade" ? cobranca.competencia : cobranca.vencimento;
  const dataRef = referencia ? new Date(`${referencia}T00:00:00Z`) : null;
  const mesTexto = dataRef ? mesCurto.format(dataRef).replace(".", "") : "";
  const mes = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);
  const evento = cobranca.tipo === "evento";

  return (
    <div className="w-10 shrink-0 text-center leading-tight">
      <p
        className={cx(
          "text-xs font-medium tabular-nums",
          evento ? "text-laranja-700 dark:text-laranja-400" : "text-azul-600 dark:text-azul-300",
        )}
      >
        {!dataRef ? "—" : evento ? mes : dataRef.getUTCFullYear()}
      </p>
      <p className="text-lg font-semibold tabular-nums">{!dataRef ? "" : evento ? dataRef.getUTCDate() : mes}</p>
    </div>
  );
}
