import type { Metadata } from "next";
import { demoDevelopers } from "@paradise/database";
import type { StatCard } from "@paradise/types";

import { getSessionUser } from "@/lib/auth";
import { getDeveloperOverviewStats } from "@/lib/data/developer-dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Panel de la desarrolladora", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/developer/dashboard", icon: "overview" },
  { label: "Proyectos", href: "/developer/dashboard/projects", icon: "buildings" },
  { label: "Leads", href: "/developer/dashboard/leads", icon: "leads" },
  { label: "Analytics", href: "/developer/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/developer/dashboard/settings", icon: "settings" },
];

export default async function DeveloperDashboardPage() {
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "developer");
  const developerId = membership?.organizationId ?? demoDevelopers[0]!.id;

  const overview = await getDeveloperOverviewStats(developerId);

  const stats: StatCard[] = [
    { key: "projects", label: "Proyectos", value: overview.projectCount },
    { key: "units", label: "Unidades totales", value: overview.unitCount },
    { key: "leads", label: "Leads en tus proyectos", value: overview.leadCount },
  ];

  return (
    <DashboardShell title="Desarrolladora" nav={NAV}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>

      <StatGrid stats={stats} />

      <p className="mt-6 rounded-xl border border-border/70 bg-card p-5 text-sm text-muted-foreground">
        Este panel reúne tus proyectos y los leads generados por ellos. Los proyectos se cargan con el
        equipo de Paradise por ahora — escríbenos para publicar uno nuevo.
      </p>
    </DashboardShell>
  );
}
