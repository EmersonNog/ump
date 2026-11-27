import { cx } from "./ui";

/**
 * Emblema oficial da União de Mocidade Presbiteriana (tocha + estrela).
 * No tema escuro usa a versão com o azul trocado por branco, para manter o contraste.
 * Arquivos em `public/marca/`, gerados a partir de `scripts/marca/ump-logo-original.png`.
 * <img> simples (não next/image) para funcionar também na tela offline, servida do cache do service worker.
 */
export function LogoUmp({ className }: { className?: string }) {
  return (
    <span className={cx("relative inline-block aspect-[268/480] shrink-0", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marca/ump-emblema.png" alt="UMP" className="absolute inset-0 size-full object-contain dark:hidden" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/marca/ump-emblema-escuro.png" alt="UMP" className="absolute inset-0 hidden size-full object-contain dark:block" />
    </span>
  );
}
