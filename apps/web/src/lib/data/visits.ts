import "server-only";

import type { VisitStatus } from "@paradise/config";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────────────────────────────────────────
 * Capa de datos de la agenda de visitas (vista del asesor / agencia). Siempre
 * con cliente admin: la autorización se resuelve en la página (agentId de la
 * sesión, membresía de agencia) y en las server actions de `actions/visits.ts`.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface AgentVisitRow {
  id: string;
  visitCode: string;
  status: VisitStatus;
  scheduledAt: string | null;
  notes: string | null;
  createdAt: string;
  leadId: string;
  leadCode: string | null;
  contactName: string;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  agentId: string | null;
  agentName: string | null;
}

/**
 * `leads!inner` (sin alias) para poder filtrar por `leads.agency_id` desde la
 * consulta de agencia. `lead_id` es NOT NULL, así que el inner join no descarta
 * filas en las demás consultas.
 */
const AGENT_VISIT_SELECT = `
  id, visit_code, lead_id, property_id, agent_id, scheduled_at, status, notes, created_at,
  leads!inner(lead_code, agency_id, contact:contacts(full_name, phone, whatsapp)),
  property:properties(title, slug),
  agent:agents(full_name)
`;

function mapAgentVisit(row: any): AgentVisitRow {
  const lead = row.leads ?? null;
  return {
    id: row.id,
    visitCode: row.visit_code,
    status: row.status,
    scheduledAt: row.scheduled_at,
    notes: row.notes,
    createdAt: row.created_at,
    leadId: row.lead_id,
    leadCode: lead?.lead_code ?? null,
    contactName: lead?.contact?.full_name ?? "—",
    contactPhone: lead?.contact?.phone ?? null,
    contactWhatsapp: lead?.contact?.whatsapp ?? null,
    propertyId: row.property_id,
    propertyTitle: row.property?.title ?? null,
    propertySlug: row.property?.slug ?? null,
    agentId: row.agent_id,
    agentName: row.agent?.full_name ?? null,
  };
}

/** Visitas asignadas a un asesor (todas, sin filtrar por estado; el componente las agrupa). */
export async function getVisitsForAgent(agentId: string): Promise<AgentVisitRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("visits")
    .select(AGENT_VISIT_SELECT)
    .eq("agent_id", agentId)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(500);
  if (error) {
    console.error("[getVisitsForAgent]", error.message);
    return [];
  }
  return (data ?? []).map(mapAgentVisit);
}

/** Visitas de todos los asesores de una agencia, vía `leads.agency_id`. */
export async function getVisitsForAgency(agencyId: string): Promise<AgentVisitRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("visits")
    .select(AGENT_VISIT_SELECT)
    .eq("leads.agency_id", agencyId)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(500);
  if (error) {
    console.error("[getVisitsForAgency]", error.message);
    return [];
  }
  return (data ?? []).map(mapAgentVisit);
}

/** Visitas de un lead (para el detalle del lead). */
export async function getVisitsForLead(leadId: string): Promise<AgentVisitRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("visits")
    .select(AGENT_VISIT_SELECT)
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: true, nullsFirst: true })
    .limit(100);
  if (error) {
    console.error("[getVisitsForLead]", error.message);
    return [];
  }
  return (data ?? []).map(mapAgentVisit);
}
