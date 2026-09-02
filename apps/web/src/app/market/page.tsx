import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Insights del mercado" };

export default function MarketPage() {
  return (
    <ComingSoon
      title="Insights del mercado"
      description="Precio promedio, precio por m², zonas populares y tendencias — con datos reales de la plataforma, no estimaciones."
      phase="fase 2"
    />
  );
}
