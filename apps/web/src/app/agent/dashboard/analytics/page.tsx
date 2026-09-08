import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getAnalytics } from "@/lib/data/analytics";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AnalyticsRange } from "@/components/dashboard/analytics-range";
import { AnalyticsView } from "@/components/dashboard/analytics-view";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Analytics · Asesor", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agent/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agent/dashboard/properties", icon: "home" },
  { label: "Leads", href: "/agent/dashboard/leads", icon: "leads" },
  { label: "Agenda", href: "/agent/dashboard/calendar", icon: "calendar" },
  { label: "Mensajes", href: "/agent/dashboard/messages", icon: "messages" },
  { label: "Cierres", href: "/agent/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/agent/dashboard/analytics", icon: "analytics" },
  { label: "Perfil", href: "/agent/dashboard/profile", icon: "profile" },
  { label: "Ajustes", href: "/agent/dashboard/settings", icon: "settings" },
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
  const real = Boolean(user?.agentId);
  const scope = { kind: "agent" as const, agentId: user?.agentId ?? "" };
  const data = real ? await getAnalytics(scope, range) : null;

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
          {!real && <Badge variant="warning">Vista de ejemplo</Badge>}
        </div>
        <AnalyticsRange active={range} />
      </div>
      {data ? (
        <AnalyticsView data={data} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Inicia sesión con tu cuenta para ver tu analítica.
        </p>
      )}
    </DashboardShell>
  );
}
