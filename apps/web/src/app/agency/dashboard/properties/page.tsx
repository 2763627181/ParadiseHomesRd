import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { demoAgencies } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getAgencyPropertyRows } from "@/lib/data/agency-dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { PropertyRowsTable } from "@/components/dashboard/property-rows-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Propiedades · Inmobiliaria", robots: { index: false } };
export const dynamic = "force-dynamic";

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

export default async function AgencyPropertiesPage() {
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "agency");
  const agencyId = membership?.organizationId ?? demoAgencies[0]!.id;

  const rows = await getAgencyPropertyRows(agencyId);

  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Propiedades</h1>
          {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
        </div>
        <Button asChild size="sm">
          <Link href="/list-property">
            <PlusIcon className="size-4" />
            Nueva propiedad
          </Link>
        </Button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {rows.length} propiedad{rows.length === 1 ? "" : "es"} de todos tus asesores.
      </p>
      <PropertyRowsTable rows={rows} showAgent />
    </DashboardShell>
  );
}
