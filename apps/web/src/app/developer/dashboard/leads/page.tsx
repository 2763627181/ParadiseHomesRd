import type { Metadata } from "next";
import { demoDevelopers } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getLeadsForDeveloper } from "@/lib/data/leads";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { LeadsStatusFilter, LeadsTable } from "@/components/dashboard/leads-table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Leads · Desarrolladora", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/developer/dashboard", icon: "overview" },
  { label: "Proyectos", href: "/developer/dashboard/projects", icon: "buildings" },
  { label: "Leads", href: "/developer/dashboard/leads", icon: "leads" },
  { label: "Cierres", href: "/developer/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/developer/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/developer/dashboard/settings", icon: "settings" },
];

export default async function DeveloperLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "developer");
  const developerId = membership?.organizationId ?? demoDevelopers[0]!.id;

  const allLeads = await getLeadsForDeveloper(developerId);
  const leads = status && status !== "ALL" ? allLeads.filter((l) => l.status === status) : allLeads;

  return (
    <DashboardShell title="Desarrolladora" nav={NAV}>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {allLeads.length} lead{allLeads.length === 1 ? "" : "s"} generados por tus proyectos.
      </p>
      <LeadsStatusFilter basePath="/developer/dashboard/leads" active={status ?? "ALL"} />
      <LeadsTable leads={leads} detailBase="/agent/dashboard/leads" />
    </DashboardShell>
  );
}
