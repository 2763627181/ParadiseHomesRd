import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { demoAgents } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getAgentPropertyRows } from "@/lib/data/agent-dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { PropertyRowsTable } from "@/components/dashboard/property-rows-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Propiedades · Asesor", robots: { index: false } };
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

export default async function AgentPropertiesPage() {
  const user = await getSessionUser();
  const agentId = user?.agentId ?? demoAgents[0]!.id;
  const rows = await getAgentPropertyRows(agentId);

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Propiedades</h1>
          {!user?.agentId && <Badge variant="warning">Vista de ejemplo</Badge>}
        </div>
        <Button asChild size="sm">
          <Link href="/list-property">
            <PlusIcon className="size-4" />
            Nueva propiedad
          </Link>
        </Button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {rows.length} propiedad{rows.length === 1 ? "" : "es"} a tu nombre.
      </p>
      <PropertyRowsTable rows={rows} />
    </DashboardShell>
  );
}
