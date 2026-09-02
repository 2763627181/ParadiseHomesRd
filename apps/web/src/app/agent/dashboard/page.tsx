import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Panel del asesor", robots: { index: false } };

export default function AgentDashboardPage() {
  return (
    <ComingSoon
      title="Panel del asesor"
      description="Overview, tus propiedades, pipeline de leads, agenda de visitas y analytics."
      phase="fase 1"
    />
  );
}
