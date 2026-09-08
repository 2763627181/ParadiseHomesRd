import type { Metadata } from "next";
import { demoAgents } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getAgentProfileRow } from "@/lib/data/agent-dashboard";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AgentSettingsForm } from "@/components/dashboard/agent-settings-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Ajustes · Asesor", robots: { index: false } };
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

export default async function AgentSettingsPage() {
  const user = await getSessionUser();
  const agentId = user?.agentId ?? demoAgents[0]!.id;
  const profile = await getAgentProfileRow(agentId);

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        {!user?.agentId && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Idiomas y zonas de cobertura que se muestran en tu perfil público. La gestión de
        notificaciones y cuenta llega en una próxima fase.
      </p>

      {profile ? (
        <AgentSettingsForm profile={profile} readOnly={!user?.agentId} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          No pudimos cargar tus ajustes.
        </p>
      )}
    </DashboardShell>
  );
}
