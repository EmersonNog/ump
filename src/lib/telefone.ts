/**
 * Celular com DDD: no banco só os 11 dígitos (constraint `profiles_telefone_formato`);
 * na tela sempre "(xx) xxxxx-xxxx", inclusive nos campos enquanto a pessoa digita.
 */

export const EXEMPLO_TELEFONE = "(86) 99999-9999";
export const ERRO_TELEFONE = `Informe o celular com DDD no formato ${EXEMPLO_TELEFONE}.`;

/** Só os dígitos (aceita colar com parênteses, +55 etc.), no máximo 11. */
function digitos(valor: string) {
  let n = valor.replace(/\D/g, "");
  if (n.length > 11 && n.startsWith("55")) n = n.slice(2);
  return n.slice(0, 11);
}

/** Máscara progressiva "(xx) xxxxx-xxxx" para o campo enquanto a pessoa digita. */
export function mascararTelefone(valor: string) {
  const n = digitos(valor);
  if (!n) return "";
  if (n.length <= 2) return `(${n}`;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

/** Exibição do número salvo (11 dígitos) como "(xx) xxxxx-xxxx". */
export function formatarTelefone(telefone: string) {
  return mascararTelefone(telefone);
}

/**
 * Valida e normaliza o que veio do formulário para gravar no banco.
 * Vazio → `null` (campo opcional); diferente de 11 dígitos → `{ erro }`.
 */
export function normalizarTelefone(valor: string): { telefone: string | null } | { erro: string } {
  if (!valor.trim()) return { telefone: null };
  const n = digitos(valor);
  return n.length === 11 ? { telefone: n } : { erro: ERRO_TELEFONE };
}

/** Número para links wa.me (com DDI 55). */
export function numeroWhatsApp(telefone: string) {
  return `55${digitos(telefone)}`;
}

/** Atributos do campo de celular (usar em componentes client): máscara ao digitar e validação do navegador. */
export const atributosTelefone = {
  type: "tel",
  inputMode: "numeric",
  autoComplete: "tel-national",
  maxLength: 15,
  pattern: "[(][0-9]{2}[)] [0-9]{5}-[0-9]{4}",
  title: ERRO_TELEFONE,
  placeholder: EXEMPLO_TELEFONE,
  onInput: (evento: { currentTarget: HTMLInputElement }) => {
    evento.currentTarget.value = mascararTelefone(evento.currentTarget.value);
  },
} as const;
