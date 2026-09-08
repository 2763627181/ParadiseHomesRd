import type { Metadata } from "next";
import { demoDevelopers } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getDeveloperProjectRows } from "@/lib/data/developer-dashboard";
import { getUnitInterestForDeveloper } from "@/lib/data/unit-interest";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DeveloperProjectsTable } from "@/components/dashboard/developer-projects-table";
import { UnitInterestTable } from "@/components/dashboard/unit-interest-table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Proyectos · Desarrolladora", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/developer/dashboard", icon: "overview" },
  { label: "Proyectos", href: "/developer/dashboard/projects", icon: "buildings" },
  { label: "Leads", href: "/developer/dashboard/leads", icon: "leads" },
  { label: "Cierres", href: "/developer/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/developer/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/developer/dashboard/settings", icon: "settings" },
];

export default async function DeveloperProjectsPage() {
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "developer");
  const developerId = membership?.organizationId ?? demoDevelopers[0]!.id;

  const [rows, unitInterest] = await Promise.all([
    getDeveloperProjectRows(developerId),
    membership ? getUnitInterestForDeveloper(developerId) : Promise.resolve([]),
  ]);

  return (
    <DashboardShell title="Desarrolladora" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Proyectos</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {rows.length} proyecto{rows.length === 1 ? "" : "s"} de tu desarrolladora. Los proyectos se
        cargan con el equipo de Paradise por ahora.
      </p>
      <DeveloperProjectsTable rows={rows} />

      <h2 className="mb-3 mt-8 text-sm font-semibold">Unidades con interés</h2>
      <UnitInterestTable rows={unitInterest} />
    </DashboardShell>
  );
}
