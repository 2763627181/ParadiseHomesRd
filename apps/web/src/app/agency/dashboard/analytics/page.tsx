import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getAnalytics } from "@/lib/data/analytics";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AnalyticsRange } from "@/components/dashboard/analytics-range";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Analytics · Inmobiliaria", robots: { index: false } };
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

function parseRange(v?: string): number {
  const n = Number(v);
  return [7, 30, 90].includes(n) ? n : 30;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);
  const user = await getSessionUser();
  const membership = user?.memberships.find((m) => m.organizationType === "agency");
  const real = Boolean(membership);
  const scope = { kind: "agency" as const, agencyId: membership?.organizationId ?? "" };
  const data = real ? await getAnalytics(scope, range) : null;

  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          {!real && <Badge variant="warning">Vista de ejemplo</Badge>}
        </div>
        <AnalyticsRange active={range} />
      </div>
      {data ? (
        <AnalyticsView data={data} showAgents />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Inicia sesión con tu cuenta para ver tu analítica.
        </p>
      )}
    </DashboardShell>
  );
}
