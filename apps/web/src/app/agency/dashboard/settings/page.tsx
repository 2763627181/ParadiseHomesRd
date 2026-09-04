import type { Metadata } from "next";
import { demoAgencies } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getAgencyProfileRow } from "@/lib/data/agency-dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AgencySettingsForm } from "@/components/dashboard/agency-settings-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Ajustes · Inmobiliaria", robots: { index: false } };
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

export default async function AgencySettingsPage() {
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "agency");
  const agencyId = membership?.organizationId ?? demoAgencies[0]!.id;

  const profile = await getAgencyProfileRow(agencyId);

  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Esta información se muestra en la página pública de tu inmobiliaria.
      </p>

      {profile ? (
        <AgencySettingsForm agencyId={agencyId} profile={profile} readOnly={!membership} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No pudimos cargar el perfil de la inmobiliaria.
        </p>
      )}
    </DashboardShell>
  );
}
