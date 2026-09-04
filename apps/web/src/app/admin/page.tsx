import type { Metadata } from "next";

import { getAdminOverview } from "@/lib/data/dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { LeadsTimeseries } from "@/components/dashboard/leads-timeseries";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

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
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Resumen del negocio</h1>
        <div className="flex gap-2">
          {overview.pendingModeration > 0 && (
            <Badge variant="warning">{overview.pendingModeration} en moderación</Badge>
          )}
          {overview.pendingVerifications > 0 && (
            <Badge variant="outline">{overview.pendingVerifications} verificaciones</Badge>
          )}
        </div>
      </div>

      <StatGrid stats={overview.stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Embudo de conversión (30 días)</h2>
          <FunnelChart stages={overview.funnel} />
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold">Leads por día</h2>
          <LeadsTimeseries data={overview.leadsTimeseries} />
        </section>
      </div>

      {overview.leadsBySource.length > 0 && (
        <section className="mt-6 rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Leads por canal</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 text-left font-medium">Canal</th>
                  <th className="py-2 text-right font-medium">Leads</th>
                  <th className="py-2 text-right font-medium">Calificados</th>
                  <th className="py-2 text-right font-medium">Cierres</th>
                  <th className="py-2 text-right font-medium">Conv.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {overview.leadsBySource.map((row) => (
                  <tr key={row.source}>
                    <td className="py-2">{row.label}</td>
                    <td className="py-2 text-right tabular-nums">{row.leads}</td>
                    <td className="py-2 text-right tabular-nums">{row.qualified}</td>
                    <td className="py-2 text-right tabular-nums">{row.closings}</td>
                    <td className="py-2 text-right tabular-nums text-muted-foreground">
                      {row.leads ? `${((row.closings / row.leads) * 100).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {overview.topProjects.length > 0 && (
        <section className="mt-6 rounded-xl border border-border/70 bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Proyectos con más leads</h2>
          <ul className="space-y-2">
            {overview.topProjects.map((project) => (
              <li key={project.id} className="flex items-center justify-between text-sm">
                <span>{project.name}</span>
                <span className="tabular-nums text-muted-foreground">{project.leads} leads</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </DashboardShell>
  );
}
