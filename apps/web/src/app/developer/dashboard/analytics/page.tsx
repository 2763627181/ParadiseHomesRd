import type { Metadata } from "next";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardComingSoon } from "@/components/dashboard/dashboard-coming-soon";

export const metadata: Metadata = { title: "Analytics · Desarrolladora", robots: { index: false } };

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/developer/dashboard", icon: "overview" },
  { label: "Proyectos", href: "/developer/dashboard/projects", icon: "buildings" },
  { label: "Leads", href: "/developer/dashboard/leads", icon: "leads" },
  { label: "Cierres", href: "/developer/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/developer/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/developer/dashboard/settings", icon: "settings" },
];

export default function DeveloperAnalyticsPage() {
  return (
    <DashboardShell title="Desarrolladora" nav={NAV}>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Analytics</h1>
      <DashboardComingSoon
        title="Analíticas avanzadas"
        description="Desempeño por proyecto, absorción de unidades y fuentes de leads, con exportes para tu equipo."
      />
    </DashboardShell>
  );
}
