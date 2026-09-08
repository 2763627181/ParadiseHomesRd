import type { Metadata } from "next";
import { demoDevelopers } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { closingStatCards, getClosingsForDeveloper, summarizeClosings } from "@/lib/data/closings";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { ClosingsTable } from "@/components/dashboard/closings-table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Cierres · Desarrolladora", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/developer/dashboard", icon: "overview" },
  { label: "Proyectos", href: "/developer/dashboard/projects", icon: "buildings" },
  { label: "Leads", href: "/developer/dashboard/leads", icon: "leads" },
  { label: "Cierres", href: "/developer/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/developer/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/developer/dashboard/settings", icon: "settings" },
];

export default async function DeveloperClosingsPage() {
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "developer");
  const developerId = membership?.organizationId ?? demoDevelopers[0]!.id;
  const rows = membership ? await getClosingsForDeveloper(developerId) : [];

  return (
    <DashboardShell title="Desarrolladora" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Cierres</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">Unidades vendidas de tus proyectos.</p>
      <StatGrid stats={closingStatCards(summarizeClosings(rows))} />
      <div className="mt-6">
        <ClosingsTable rows={rows} showAgent />
      </div>
    </DashboardShell>
  );
}
