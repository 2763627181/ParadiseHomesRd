import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Comparador de propiedades" };

export default function ComparePage() {
  return (
    <ComingSoon
      title="Comparador"
      description="Pronto podrás comparar hasta 4 propiedades: precio, m², precio/m², amenidades, entrega y más."
      phase="fase 2"
    />
  );
}
