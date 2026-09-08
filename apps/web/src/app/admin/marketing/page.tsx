import type { Metadata } from "next";

import { getMarketingReport } from "@/lib/data/marketing";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AnalyticsRange } from "@/components/dashboard/analytics-range";
import { StatGrid } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Marketing · Admin", robots: { index: false } };
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

function pct(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : "—";
}

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const range = parseRange((await searchParams).range);
  const report = await getMarketingReport(range);

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Rendimiento por campaña, a partir de la atribución UTM de sesiones y leads.
          </p>
        </div>
        <AnalyticsRange active={range} />
      </div>

      {!report ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Conecta Supabase para ver el rendimiento de campañas.
        </p>
      ) : (
        <>
          <StatGrid
            stats={[
              { key: "sessions", label: "Sesiones atribuidas", value: report.totals.sessions },
              { key: "leads", label: "Leads", value: report.totals.leads },
              { key: "closings", label: "Cierres", value: report.totals.closings },
              { key: "conv", label: "Sesión → lead", value: pct(report.totals.leads, report.totals.sessions) },
              { key: "close", label: "Lead → cierre", value: pct(report.totals.closings, report.totals.leads) },
            ]}
          />

          <div className="mt-6 overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Campaña</th>
                  <th className="px-4 py-2.5 text-left font-medium">Fuente / medio</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sesiones</th>
                  <th className="px-4 py-2.5 text-right font-medium">Vistas</th>
                  <th className="px-4 py-2.5 text-right font-medium">Leads</th>
                  <th className="px-4 py-2.5 text-right font-medium">Calif.</th>
                  <th className="px-4 py-2.5 text-right font-medium">Cierres</th>
                  <th className="px-4 py-2.5 text-right font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {report.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Sin actividad con atribución en el período.
                    </td>
                  </tr>
                ) : (
                  report.campaigns.map((c) => (
                    <tr key={c.key} className="hover:bg-secondary/30">
                      <td className="px-4 py-3 font-medium">{c.campaign}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.source} / {c.medium}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.sessions}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.propertyViews}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.leads}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.qualified}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{c.closings}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                        {pct(c.leads, c.sessions)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
