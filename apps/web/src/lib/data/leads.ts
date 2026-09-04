import "server-only";

import type { Lead, LeadActivity, LeadNote } from "@paradise/types";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

const LEAD_SELECT = `
  id, lead_code, contact_id, property_id, project_id, unit_id, agent_id, agency_id, developer_id,
  source, channel, status, message, campaign, utm_source, utm_medium, utm_campaign,
  first_touch, last_touch, next_activity_at, created_at, updated_at,
  contact:contacts(full_name, email, phone, whatsapp),
  property:properties(title),
  agent:agents(full_name)
`;

function mapLead(row: any): Lead {
  return {
    id: row.id,
    leadCode: row.lead_code,
    contactId: row.contact_id,
    contact: {
      fullName: row.contact?.full_name ?? "—",
      email: row.contact?.email ?? null,
      phone: row.contact?.phone ?? null,
      whatsapp: row.contact?.whatsapp ?? null,
    },
    propertyId: row.property_id,
    propertyCode: null,
    propertyTitle: row.property?.title ?? null,
    projectId: row.project_id,
    unitId: row.unit_id,
    agentId: row.agent_id,
    agentName: row.agent?.full_name ?? null,
    agencyId: row.agency_id,
    developerId: row.developer_id,
    source: row.source,
    channel: row.channel,
    status: row.status,
    message: row.message,
    attribution:
      row.first_touch && row.last_touch
        ? { firstTouch: row.first_touch, lastTouch: row.last_touch, source: row.source }
        : null,
    campaign: row.campaign,
    nextActivityAt: row.next_activity_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getLeadsForAgent(agentId: string): Promise<Lead[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("leads")
    .select(LEAD_SELECT)
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) {
    console.error("[getLeadsForAgent]", error.message);
    return [];
  }
  return (data ?? []).map(mapLead);
}

export async function getLeadsForAgency(agencyId: string): Promise<Lead[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("leads")
    .select(LEAD_SELECT)
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []).map(mapLead);
}

export async function getAllLeadsAdmin(): Promise<Lead[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("leads")
    .select(LEAD_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    console.error("[getAllLeadsAdmin]", error.message);
    return [];
  }
  return (data ?? []).map(mapLead);
}

export interface LeadDetail {
  lead: Lead;
  activities: LeadActivity[];
  notes: LeadNote[];
}

export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: row, error } = await admin.from("leads").select(LEAD_SELECT).eq("id", id).maybeSingle();
  if (error || !row) return null;

  const [{ data: acts }, { data: notes }] = await Promise.all([
    admin
      .from("lead_activities")
      .select("*")
      .eq("lead_id", id)
      .order("occurred_at", { ascending: false }),
    admin.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);

  return {
    lead: mapLead(row),
    activities: (acts ?? []).map(
      (a: any): LeadActivity => ({
        id: a.id,
        leadId: a.lead_id,
        type: a.type,
        title: a.title,
        body: a.body,
        actorId: a.actor_id,
        actorName: a.actor_name,
        metadata: a.metadata ?? {},
        occurredAt: a.occurred_at,
      }),
    ),
    notes: (notes ?? []).map(
      (n: any): LeadNote => ({
        id: n.id,
        leadId: n.lead_id,
        authorId: n.author_id,
        authorName: n.author_name,
        body: n.body,
        createdAt: n.created_at,
      }),
    ),
  };
}

/** Agentes de una agencia, para el selector de asignación. */
export async function getAssignableAgents(agencyId: string | null) {
  const admin = getSupabaseAdminClient();
  if (!admin || !agencyId) return [];
  const { data } = await admin
    .from("agents")
    .select("id, full_name, avatar_url")
    .eq("agency_id", agencyId)
    .order("full_name");
  return (data ?? []) as { id: string; full_name: string; avatar_url: string | null }[];
}
