/**
 * Celular no padrão "xx xxxxx-xxxx" (DDD + 9 dígitos). É assim que fica salvo no banco
 * (constraint `profiles_telefone_formato`) e assim que aparece em todas as telas.
 */

export const PADRAO_TELEFONE = "^[0-9]{2} [0-9]{5}-[0-9]{4}$";
export const EXEMPLO_TELEFONE = "86 99999-9999";
export const ERRO_TELEFONE = `Informe o celular com DDD no formato ${EXEMPLO_TELEFONE}.`;

/** Aplica a máscara enquanto a pessoa digita (aceita colar com parênteses, +55 etc.). */
export function mascararTelefone(valor: string) {
  let n = valor.replace(/\D/g, "");
  if (n.length > 11 && n.startsWith("55")) n = n.slice(2);
  n = n.slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `${n.slice(0, 2)} ${n.slice(2)}`;
  return `${n.slice(0, 2)} ${n.slice(2, 7)}-${n.slice(7)}`;
}

/**
 * Valida e normaliza o que veio do formulário.
 * Vazio → `null` (campo opcional); fora do padrão → `{ erro }`.
 */
export function normalizarTelefone(valor: string): { telefone: string | null } | { erro: string } {
  if (!valor.trim()) return { telefone: null };
  const telefone = mascararTelefone(valor);
  return new RegExp(PADRAO_TELEFONE).test(telefone) ? { telefone } : { erro: ERRO_TELEFONE };
}

/** Número para links wa.me (com DDI 55). */
export function numeroWhatsApp(telefone: string) {
  return `55${telefone.replace(/\D/g, "")}`;
}

/** Atributos do campo de celular (usar em componentes client): máscara ao digitar e validação do navegador. */
export const atributosTelefone = {
  type: "tel",
  inputMode: "numeric",
  autoComplete: "tel-national",
  maxLength: 13,
  pattern: "[0-9]{2} [0-9]{5}-[0-9]{4}",
  title: ERRO_TELEFONE,
  placeholder: EXEMPLO_TELEFONE,
  onInput: (evento: { currentTarget: HTMLInputElement }) => {
    evento.currentTarget.value = mascararTelefone(evento.currentTarget.value);
  },
} as const;
