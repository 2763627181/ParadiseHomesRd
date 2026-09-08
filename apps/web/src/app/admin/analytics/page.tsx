import type { Metadata } from "next";

import { getAnalytics } from "@/lib/data/analytics";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AnalyticsRange } from "@/components/dashboard/analytics-range";
import { AnalyticsView } from "@/components/dashboard/analytics-view";

export const metadata: Metadata = { title: "Analytics · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/admin", icon: "overview" },
  { label: "Propiedades", href: "/admin/properties", icon: "buildings" },
  { label: "Proyectos", href: "/admin/projects", icon: "projects" },
  { label: "Usuarios", href: "/admin/users", icon: "users" },
  { label: "Agentes", href: "/admin/agents", icon: "agents" },
  { label: "Inmobiliarias", href: "/admin/agencies", icon: "building" },
  { label: "Desarrolladoras", href: "/admin/developers", icon: "developers" },
  { label: "Leads", href: "/admin/leads", icon: "leads" },
  { label: "Verificaciones", href: "/admin/verifications", icon: "verify" },
  { label: "Solicitudes", href: "/admin/partners", icon: "partners" },
  { label: "Cierres", href: "/admin/closings", icon: "closings" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

function parseRange(v?: string): number {
  const n = Number(v);
  return [7, 30, 90].includes(n) ? n : 30;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);
  const data = await getAnalytics({ kind: "admin" }, range);

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <AnalyticsRange active={range} />
      </div>
      {data ? (
        <AnalyticsView data={data} showAgents showTraffic />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Conecta Supabase para ver analítica real.
        </p>
      )}
    </DashboardShell>
  );
}
