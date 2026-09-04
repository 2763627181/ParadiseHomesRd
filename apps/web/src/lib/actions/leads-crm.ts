"use server";

import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@paradise/config";

import { getSessionUser, isAgencyUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { STATUS_LABELS_ES } from "@/lib/lead-status";

export interface CrmResult {
  ok: boolean;
  message?: string;
}

/** El usuario puede gestionar el lead si es staff, el agente asignado, o admin de la agencia dueña. */
async function canManageLead(leadId: string) {
  const user = await getSessionUser();
  if (!user) return { user: null, allowed: false, admin: null as ReturnType<typeof getSupabaseAdminClient> };

  const admin = getSupabaseAdminClient();
  if (!admin) return { user, allowed: false, admin };

  if (isStaffUser(user)) return { user, allowed: true, admin };

  const { data: lead } = await admin
    .from("leads")
    .select("agent_id, agency_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { user, allowed: false, admin };

  const isOwnLead = lead.agent_id === user.agentId;
  const isAgencyManager =
    isAgencyUser(user) &&
    user.memberships.some((m) => m.organizationType === "agency" && m.organizationId === lead.agency_id);

  return { user, allowed: isOwnLead || isAgencyManager, admin };
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus,
  note?: string,
): Promise<CrmResult> {
  const { user, allowed, admin } = await canManageLead(leadId);
  if (!allowed || !admin) return { ok: false, message: "No autorizado." };

  const patch: Record<string, unknown> = { status };
  const now = new Date().toISOString();
  if (status === "CONTACTED") patch.contacted_at = now;
  if (status === "QUALIFIED") patch.qualified_at = now;
  if (status === "CLOSED_WON" || status === "CLOSED_LOST") patch.closed_at = now;

  const { error } = await admin.from("leads").update(patch).eq("id", leadId);
  if (error) return { ok: false, message: error.message };

  await admin.from("lead_activities").insert({
    lead_id: leadId,
    type: "status_changed",
    title: `Estado cambiado a ${STATUS_LABELS_ES[status]}`,
    body: note ?? null,
    actor_id: user!.id,
    actor_name: user!.fullName,
  });

  revalidatePath(`/agent/dashboard/leads/${leadId}`);
  revalidatePath("/agent/dashboard/leads");
  revalidatePath("/agency/dashboard/leads");
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function addLeadNote(leadId: string, body: string): Promise<CrmResult> {
  const { user, allowed, admin } = await canManageLead(leadId);
  if (!allowed || !admin) return { ok: false, message: "No autorizado." };
  if (!body.trim()) return { ok: false, message: "Escribe una nota." };

  const { error } = await admin.from("lead_notes").insert({
    lead_id: leadId,
    author_id: user!.id,
    author_name: user!.fullName,
    body: body.trim(),
  });
  if (error) return { ok: false, message: error.message };

  await admin.from("lead_activities").insert({
    lead_id: leadId,
    type: "note_added",
    title: `${user!.fullName} agregó una nota`,
    body: body.trim(),
    actor_id: user!.id,
    actor_name: user!.fullName,
  });

  revalidatePath(`/agent/dashboard/leads/${leadId}`);
  return { ok: true };
}

export async function assignLeadToAgent(leadId: string, agentId: string): Promise<CrmResult> {
  const user = await getSessionUser();
  if (!user || !(isStaffUser(user) || isAgencyUser(user))) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: agent } = await admin.from("agents").select("full_name").eq("id", agentId).maybeSingle();

  const { error } = await admin
    .from("leads")
    .update({ agent_id: agentId, assigned_at: new Date().toISOString(), assigned_by: user.id })
    .eq("id", leadId);
  if (error) return { ok: false, message: error.message };

  await admin.from("lead_assignments").insert({ lead_id: leadId, agent_id: agentId, assigned_by: user.id });
  await admin.from("lead_activities").insert({
    lead_id: leadId,
    type: "assigned",
    title: `Asignado a ${agent?.full_name ?? "un asesor"}`,
    actor_id: user.id,
    actor_name: user.fullName,
  });

  revalidatePath(`/agent/dashboard/leads/${leadId}`);
  revalidatePath("/agency/dashboard/leads");
  revalidatePath("/admin/leads");
  return { ok: true };
}

export async function scheduleNextActivity(leadId: string, when: string): Promise<CrmResult> {
  const { allowed, admin } = await canManageLead(leadId);
  if (!allowed || !admin) return { ok: false, message: "No autorizado." };

  const { error } = await admin.from("leads").update({ next_activity_at: when }).eq("id", leadId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/agent/dashboard/leads/${leadId}`);
  return { ok: true };
}
