import type { Metadata } from "next";

import { getAdminOverview } from "@/lib/data/dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Panel de la inmobiliaria", robots: { index: false } };

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agency/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agency/dashboard/properties", icon: "home" },
  { label: "Proyectos", href: "/agency/dashboard/projects", icon: "buildings" },
  { label: "Asesores", href: "/agency/dashboard/agents", icon: "users" },
  { label: "Leads", href: "/agency/dashboard/leads", icon: "leads" },
  { label: "Visitas", href: "/agency/dashboard/visits", icon: "visits" },
  { label: "Cierres", href: "/agency/dashboard/closings", icon: "closings" },
  { label: "Importar", href: "/agency/dashboard/import", icon: "import" },
  { label: "Analytics", href: "/agency/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/agency/dashboard/settings", icon: "settings" },
];

export default async function AgencyDashboardPage() {
  const [user, overview] = await Promise.all([getSessionUser(), getAdminOverview()]);

  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
        {!user && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>

      <StatGrid stats={overview.stats.slice(0, 5)} />

      <div className="mt-6 rounded-xl border border-border/70 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold">Embudo de tus leads (30 días)</h2>
        <FunnelChart stages={overview.funnel} />
      </div>
    </DashboardShell>
  );
}
