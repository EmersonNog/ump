/** Tema claro/escuro: preferência salva no aparelho e aplicada em <html data-tema>. Sem preferência salva, o padrão é o claro. */

export type PreferenciaTema = "claro" | "escuro" | "sistema";

export const CHAVE_TEMA = "ump:tema";
const COR_BARRA = { claro: "#f4f5f8", escuro: "#060a22" } as const;

/**
 * Roda no <head> antes da primeira pintura (sem "piscar" o tema errado).
 * Também acompanha a troca de tema do sistema quando a preferência é "sistema" (opção "Automático" do Perfil).
 */
export const SCRIPT_TEMA = `(function(){try{
var k=${JSON.stringify(CHAVE_TEMA)},c=${JSON.stringify(COR_BARRA)},m=matchMedia("(prefers-color-scheme: dark)");
function a(){var p=localStorage.getItem(k)||"claro";var t=p==="sistema"?(m.matches?"escuro":"claro"):p==="escuro"?"escuro":"claro";
document.documentElement.setAttribute("data-tema",t);
document.querySelectorAll('meta[name="theme-color"]').forEach(function(e){e.setAttribute("content",c[t])});}
a();m.addEventListener("change",a);window.__aplicarTema=a;
}catch(e){}})();`;

export function lerPreferencia(): PreferenciaTema {
  const valor = localStorage.getItem(CHAVE_TEMA);
  return valor === "escuro" || valor === "sistema" ? valor : "claro";
}

export function temaAtual(): "claro" | "escuro" {
  return document.documentElement.getAttribute("data-tema") === "escuro" ? "escuro" : "claro";
}

/**
 * Salva a preferência e reaplica (reaproveita a função criada pelo script do <head>).
 * Com `origem` (ponto do toque), o novo tema se revela num círculo a partir dali (View Transitions).
 */
export function definirPreferencia(preferencia: PreferenciaTema, origem?: { x: number; y: number }) {
  localStorage.setItem(CHAVE_TEMA, preferencia);

  const antes = temaAtual();
  const trocar = () => {
    reaplicarTema();
    window.dispatchEvent(new Event("ump:tema"));
  };

  const semAnimacao =
    !origem || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (semAnimacao) return trocar();

  const transicao = document.startViewTransition(trocar);
  transicao.ready.then(() => {
    if (temaAtual() === antes) return; // "Automático" que não mudou nada visível
    const raio = Math.hypot(Math.max(origem.x, innerWidth - origem.x), Math.max(origem.y, innerHeight - origem.y));
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${origem.x}px ${origem.y}px)`, `circle(${raio}px at ${origem.x}px ${origem.y}px)`] },
      { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  });
}

export function reaplicarTema() {
  const aplicar: unknown = Reflect.get(window, "__aplicarTema");
  if (typeof aplicar === "function") aplicar();
}
