import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminPage() {
  return (
    <ComingSoon
      title="Panel administrativo"
      description="Moderación, verificaciones, funnel, leads, cierres, comisiones y analytics de negocio."
      phase="fase 1"
    />
  );
}
