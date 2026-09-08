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

export const metadata: Metadata = { title: "Detalle de lead · Admin", robots: { index: false } };
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

export default async function AdminLeadDetailPage({
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

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <Link
        href="/admin/leads"
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
              <VisitsAgenda visits={visits} canManage={Boolean(user?.agentId)} leadBase="/admin/leads" />
            </div>
          )}
          <div>
            <h2 className="mb-3 text-sm font-semibold">Historial</h2>
            <LeadTimeline activities={detail.activities} />
          </div>
        </div>
        <div className="space-y-4">
          <LeadContactCard lead={detail.lead} />
          <LeadAssignPanel lead={detail.lead} agents={agents} />
          <LeadNotesPanel leadId={detail.lead.id} notes={detail.notes} />
        </div>
      </div>
    </DashboardShell>
  );
}
