import type { Metadata } from "next";
import { demoDevelopers } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getDeveloperProfileRow } from "@/lib/data/developer-dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DeveloperSettingsForm } from "@/components/dashboard/developer-settings-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Ajustes · Desarrolladora", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/developer/dashboard", icon: "overview" },
  { label: "Proyectos", href: "/developer/dashboard/projects", icon: "buildings" },
  { label: "Leads", href: "/developer/dashboard/leads", icon: "leads" },
  { label: "Cierres", href: "/developer/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/developer/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/developer/dashboard/settings", icon: "settings" },
];

export default async function DeveloperSettingsPage() {
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "developer");
  const developerId = membership?.organizationId ?? demoDevelopers[0]!.id;

  const profile = await getDeveloperProfileRow(developerId);

  return (
    <DashboardShell title="Desarrolladora" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        {!membership && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Esta información se muestra en la página pública de tu desarrolladora.
      </p>

      {profile ? (
        <DeveloperSettingsForm developerId={developerId} profile={profile} readOnly={!membership} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No pudimos cargar el perfil de la desarrolladora.
        </p>
      )}
    </DashboardShell>
  );
}
