import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Panel de la inmobiliaria", robots: { index: false } };

export default function AgencyDashboardPage() {
  return (
    <ComingSoon
      title="Panel de la inmobiliaria"
      description="Administra propiedades, proyectos, asesores, asignación de leads, cierres y analytics."
      phase="fase 1"
    />
  );
}
