import type { Metadata } from "next";
import { demoAgents } from "@paradise/database";

import { getSessionUser } from "@/lib/auth";
import { getConversationsForAgent } from "@/lib/data/messaging";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { ConversationList } from "@/components/messaging/conversation-list";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Mensajes · Asesor", robots: { index: false } };
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

export default async function AgentMessagesPage() {
  const user = await getSessionUser();
  const agentId = user?.agentId ?? demoAgents[0]!.id;
  const conversations = user?.agentId ? await getConversationsForAgent(agentId, user.id) : [];

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Mensajes</h1>
        {!user?.agentId && <Badge variant="warning">Vista de ejemplo</Badge>}
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        {conversations.length} conversación{conversations.length === 1 ? "" : "es"} con tus clientes.
      </p>
      <ConversationList
        conversations={conversations}
        basePath="/agent/dashboard/messages"
        emptyTitle="Aún no tienes conversaciones"
        emptyDescription="Cuando un cliente te escriba desde una propiedad, o abras un chat desde un lead, aparecerá aquí."
      />
    </DashboardShell>
  );
}
