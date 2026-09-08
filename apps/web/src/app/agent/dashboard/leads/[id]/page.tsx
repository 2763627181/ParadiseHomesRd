import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { getAssignableAgents, getLeadDetail } from "@/lib/data/leads";
import { getVisitsForLead } from "@/lib/data/visits";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import {
  LeadAssignPanel,
  LeadContactCard,
  LeadNotesPanel,
  LeadStatusControl,
  LeadTimeline,
  ScheduleActivityHint,
} from "@/components/dashboard/lead-detail";
import { StartConversationButton } from "@/components/messaging/start-conversation-button";
import { ScheduleVisitButton } from "@/components/dashboard/schedule-visit-button";
import { RegisterClosingButton } from "@/components/dashboard/register-closing-button";
import { VisitsAgenda } from "@/components/dashboard/visits-agenda";

export const metadata: Metadata = { title: "Detalle de lead", robots: { index: false } };
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

export default async function AgentLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, detail] = await Promise.all([getSessionUser(), getLeadDetail(id)]);
  if (!detail) notFound();

  const [agents, visits] = await Promise.all([
    getAssignableAgents(detail.lead.agencyId),
    getVisitsForLead(id),
  ]);
  const canAssign =
    user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "AGENCY_ADMIN");

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <Link
        href="/agent/dashboard/leads"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeftIcon className="size-4" />
        Todos los leads
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{detail.lead.leadCode}</h1>
          {detail.lead.propertyTitle && (
            <p className="text-sm text-muted-foreground">{detail.lead.propertyTitle}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <StartConversationButton leadId={detail.lead.id} variant="agent" />
          <ScheduleVisitButton leadId={detail.lead.id} />
          <RegisterClosingButton leadId={detail.lead.id} />
        </div>
      </div>

      <ScheduleActivityHint nextActivityAt={detail.lead.nextActivityAt} />

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <LeadStatusControl lead={detail.lead} />
          {visits.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold">Visitas</h2>
              <VisitsAgenda visits={visits} canManage={Boolean(user?.agentId)} />
            </div>
          )}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Historial</h2>
            <LeadTimeline activities={detail.activities} />
          </div>
        </div>
        <div className="space-y-4">
          <LeadContactCard lead={detail.lead} />
          {canAssign && <LeadAssignPanel lead={detail.lead} agents={agents} />}
          <LeadNotesPanel leadId={detail.lead.id} notes={detail.notes} />
        </div>
      </div>
    </DashboardShell>
  );
}
