import type { Metadata } from "next";
import { demoAgents } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { closingStatCards, getClosingsForAgent, summarizeClosings } from "@/lib/data/closings";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { ClosingsTable } from "@/components/dashboard/closings-table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Cierres · Asesor", robots: { index: false } };
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

export default async function AgentClosingsPage() {
  const user = await getSessionUser();
  const agentId = user?.agentId ?? demoAgents[0]!.id;
  const rows = user?.agentId ? await getClosingsForAgent(agentId) : [];

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Cierres</h1>
        {!user?.agentId && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Registra tus ventas y alquileres cerrados desde el detalle de cada lead ganado.
      </p>
      <StatGrid stats={closingStatCards(summarizeClosings(rows))} />
      <div className="mt-6">
        <ClosingsTable rows={rows} />
      </div>
    </DashboardShell>
  );
}
