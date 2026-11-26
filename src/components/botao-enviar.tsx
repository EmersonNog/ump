"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Botao } from "./ui";
import type { ComponentProps } from "react";

export function BotaoEnviar({ children, disabled, ...props }: ComponentProps<typeof Botao>) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Botao>
  );
}
