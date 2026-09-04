import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { demoAgents } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getLeadsForAgent } from "@/lib/data/leads";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { LeadsStatusFilter, LeadsTable } from "@/components/dashboard/leads-table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Leads · Asesor", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agent/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agent/dashboard/properties", icon: "home" },
  { label: "Leads", href: "/agent/dashboard/leads", icon: "leads" },
  { label: "Agenda", href: "/agent/dashboard/calendar", icon: "calendar" },
  { label: "Mensajes", href: "/agent/dashboard/messages", icon: "messages" },
  { label: "Analytics", href: "/agent/dashboard/analytics", icon: "analytics" },
  { label: "Perfil", href: "/agent/dashboard/profile", icon: "profile" },
  { label: "Ajustes", href: "/agent/dashboard/settings", icon: "settings" },
];

export default async function AgentLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await getSessionUser();

  if (user && !user.agentId && user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const agentId = user?.agentId ?? demoAgents[0]!.id;
  const allLeads = await getLeadsForAgent(agentId);
  const leads = status && status !== "ALL" ? allLeads.filter((l) => l.status === status) : allLeads;

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Leads</h1>
        {!user?.agentId && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {allLeads.length} lead{allLeads.length === 1 ? "" : "s"} en total. Da seguimiento antes de
        que se enfríen.
      </p>
      <LeadsStatusFilter basePath="/agent/dashboard/leads" active={status ?? "ALL"} />
      <LeadsTable leads={leads} detailBase="/agent/dashboard/leads" />
    </DashboardShell>
  );
}
