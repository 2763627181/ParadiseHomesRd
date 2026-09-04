import type { Metadata } from "next";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardComingSoon } from "@/components/dashboard/dashboard-coming-soon";

export const metadata: Metadata = { title: "Analytics · Inmobiliaria", robots: { index: false } };

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agency/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agency/dashboard/properties", icon: "home" },
  { label: "Proyectos", href: "/agency/dashboard/projects", icon: "buildings" },
  { label: "Asesores", href: "/agency/dashboard/agents", icon: "users" },
  { label: "Leads", href: "/agency/dashboard/leads", icon: "leads" },
  { label: "Importar", href: "/agency/dashboard/import", icon: "import" },
  { label: "Analytics", href: "/agency/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/agency/dashboard/settings", icon: "settings" },
];

export default function AgencyAnalyticsPage() {
  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Analytics</h1>
      <DashboardComingSoon
        title="Analíticas avanzadas"
        description="Desempeño por asesor, por zona y por fuente de leads, con exportes para tu equipo."
      />
    </DashboardShell>
  );
}
