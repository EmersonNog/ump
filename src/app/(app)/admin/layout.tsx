import type { ReactNode } from "react";
import { AbasAdmin } from "./abas";
import { exigirAdmin } from "@/lib/auth";

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  await exigirAdmin();
  return (
    <>
      <AbasAdmin />
      {children}
    </>
  );
}
