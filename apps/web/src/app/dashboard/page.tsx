import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default function DashboardPage() {
  return (
    <ComingSoon
      title="Tu panel"
      description="Favoritos sincronizados, consultas, visitas, propiedades vistas y alertas — todo en un lugar."
      phase="fase 1"
    />
  );
}
