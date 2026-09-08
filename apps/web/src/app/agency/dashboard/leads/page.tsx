import type { Metadata } from "next";
import { demoAgencies } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getLeadsForAgency } from "@/lib/data/leads";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { LeadsStatusFilter, LeadsTable } from "@/components/dashboard/leads-table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Leads · Inmobiliaria", robots: { index: false } };
export const dynamic = "force-dynamic";

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

export default async function AgencyLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "agency");
  const agencyId = membership?.organizationId ?? demoAgencies[0]!.id;

  const allLeads = await getLeadsForAgency(agencyId);
  const leads = status && status !== "ALL" ? allLeads.filter((l) => l.status === status) : allLeads;

  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {allLeads.length} lead{allLeads.length === 1 ? "" : "s"} de todos tus asesores.
      </p>
      <LeadsStatusFilter basePath="/agency/dashboard/leads" active={status ?? "ALL"} />
      <LeadsTable leads={leads} detailBase="/agent/dashboard/leads" />
    </DashboardShell>
  );
}
