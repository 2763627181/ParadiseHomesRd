import type { Metadata } from "next";
import Link from "next/link";
import { formatVisitDateRd, formatRelativeRd } from "@paradise/utils/datetime";

import { getSessionUser } from "@/lib/auth";
import { getAgentOverview } from "@/lib/data/dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { LeadPipeline } from "@/components/dashboard/lead-pipeline";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Panel del asesor", robots: { index: false } };

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

export default async function AgentDashboardPage() {
  const user = await getSessionUser();
  const overview = await getAgentOverview(user?.agentId ?? null);
  const pipelineCounts = Object.fromEntries(overview.pipeline.map((p) => [p.status, p.count]));

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
        {!user && (
          <Badge variant="warning">Vista de ejemplo — inicia sesión para ver tus datos</Badge>
        )}
      </div>

      <StatGrid stats={overview.stats} />

      <div className="mt-6">
        <LeadPipeline counts={pipelineCounts} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Últimos leads</h2>
          <ul className="divide-y divide-border/70">
            {overview.recentLeads.map((lead) => (
              <li key={lead.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{lead.contactName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {lead.propertyTitle} · {formatRelativeRd(lead.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">{lead.status}</Badge>
              </li>
            ))}
          </ul>
          <Link
            href="/agent/dashboard/leads"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            Ver todos →
          </Link>
        </section>

        <section className="rounded-xl border border-border/70 bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold">Próximas visitas</h2>
          <ul className="divide-y divide-border/70">
            {overview.upcomingVisits.map((visit) => (
              <li key={visit.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{visit.clientName}</p>
                  <p className="truncate text-xs text-muted-foreground">{visit.propertyTitle}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatVisitDateRd(visit.scheduledAt)}
                </span>
              </li>
            ))}
            {overview.upcomingVisits.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">Sin visitas agendadas.</li>
            )}
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
