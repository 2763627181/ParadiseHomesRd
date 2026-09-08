"use server";

import { revalidatePath } from "next/cache";
import type { LeadStatus, VisitStatus } from "@paradise/config";
import type { SessionUser } from "@paradise/types";
import { formatTimeRd, formatVisitDateRd } from "@paradise/utils/datetime";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { notifyAgent, notifyLeadContact } from "@/lib/notify";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface VisitActionResult {
  ok: boolean;
  message?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * Autorización.
 *
 * Puede gestionar una visita quien sea: staff (ADMIN/SUPER_ADMIN), el asesor
 * asignado a la visita (`visits.agent_id === user.agentId`), o un miembro
 * 'owner'/'admin' de la agencia dueña del lead (`leads.agency_id`). Para
 * cancelar, además, el propio cliente (`contacts.profile_id === user.id`).
 * Todas las escrituras van por el cliente admin tras esta comprobación.
 * ───────────────────────────────────────────────────────────────────────────── */

interface VisitContext {
  id: string;
  leadId: string;
  agentId: string | null;
  propertyId: string | null;
  status: VisitStatus;
  scheduledAt: string | null;
  propertyTitle: string | null;
  leadStatus: LeadStatus;
  leadAgencyId: string | null;
  contactProfileId: string | null;
}

const VISIT_CONTEXT_SELECT = `
  id, lead_id, agent_id, property_id, status, scheduled_at,
  property:properties(title),
  leads!inner(status, agency_id, contact:contacts(profile_id))
`;

function mapVisitContext(row: any): VisitContext {
  return {
    id: row.id,
    leadId: row.lead_id,
    agentId: row.agent_id,
    propertyId: row.property_id,
    status: row.status,
    scheduledAt: row.scheduled_at,
    propertyTitle: row.property?.title ?? null,
    leadStatus: row.leads?.status,
    leadAgencyId: row.leads?.agency_id ?? null,
    contactProfileId: row.leads?.contact?.profile_id ?? null,
  };
}

function isAgencyManagerOf(user: SessionUser, agencyId: string | null): boolean {
  if (!agencyId) return false;
  return user.memberships.some(
    (m) =>
      m.organizationType === "agency" &&
      m.organizationId === agencyId &&
      (m.role === "owner" || m.role === "admin"),
  );
}

function canManage(user: SessionUser, target: { agentId: string | null; agencyId: string | null }) {
  if (isStaffUser(user)) return true;
  const isOwnAgent = user.agentId != null && target.agentId === user.agentId;
  return isOwnAgent || isAgencyManagerOf(user, target.agencyId);
}

async function loadVisitForUser(visitId: string, opts: { allowContact?: boolean } = {}) {
  const user = await getSessionUser();
  if (!user) return { user: null, admin: null, visit: null, allowed: false };

  const admin = getSupabaseAdminClient();
  if (!admin) return { user, admin: null, visit: null, allowed: false };

  const { data, error } = await admin
    .from("visits")
    .select(VISIT_CONTEXT_SELECT)
    .eq("id", visitId)
    .maybeSingle();
  if (error || !data) return { user, admin, visit: null, allowed: false };

  const visit = mapVisitContext(data);
  const allowed =
    canManage(user, { agentId: visit.agentId, agencyId: visit.leadAgencyId }) ||
    (opts.allowContact === true && visit.contactProfileId != null && visit.contactProfileId === user.id);

  return { user, admin, visit, allowed };
}

/* ── helpers ─────────────────────────────────────────────────────────────── */

function parseScheduledAt(input: string | null | undefined): { ok: true; iso: string } | { ok: false; message: string } {
  if (!input) return { ok: false, message: "Elige una fecha y hora para la visita." };
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return { ok: false, message: "La fecha de la visita no es válida." };
  return { ok: true, iso: date.toISOString() };
}

function describeWhen(iso: string): string {
  return `${formatVisitDateRd(iso)}, ${formatTimeRd(iso)}`;
}

function revalidateVisitPaths(leadId: string) {
  revalidatePath("/agent/dashboard/calendar");
  revalidatePath("/agency/dashboard/visits");
  revalidatePath("/dashboard/visits");
  revalidatePath(`/agent/dashboard/leads/${leadId}`);
}

async function logActivity(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  input: { leadId: string; type: string; title: string; body?: string | null; user: SessionUser; metadata?: Record<string, unknown> },
) {
  const { error } = await admin.from("lead_activities").insert({
    lead_id: input.leadId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    actor_id: input.user.id,
    actor_name: input.user.fullName,
    metadata: input.metadata ?? {},
  });
  if (error) console.error("[visits:activity]", error.message);
}

/** Avanza el estado del lead solo si está en uno de los estados previos indicados. */
async function advanceLeadStatus(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  leadId: string,
  current: LeadStatus,
  from: LeadStatus[],
  to: LeadStatus,
) {
  if (!from.includes(current)) return;
  const { error } = await admin.from("leads").update({ status: to }).eq("id", leadId);
  if (error) console.error("[visits:leadStatus]", error.message);
}

async function notifyContactScheduled(leadId: string, visitId: string, propertyTitle: string | null, iso: string) {
  await notifyLeadContact(leadId, {
    type: "visit_scheduled",
    title: "Tu visita fue confirmada",
    body: `${propertyTitle ?? "Propiedad"} — ${describeWhen(iso)}`,
    payload: { visitId, leadId, href: "/dashboard/visits" },
    email: true,
  });
}

/* ── acciones ────────────────────────────────────────────────────────────── */

/** Confirma fecha/hora de una visita (normalmente una solicitud REQUESTED) y la pasa a SCHEDULED. */
export async function scheduleVisit(
  visitId: string,
  scheduledAtISO: string,
  notes?: string,
): Promise<VisitActionResult> {
  const { user, admin, visit, allowed } = await loadVisitForUser(visitId);
  if (!allowed || !admin || !visit || !user) return { ok: false, message: "No autorizado." };
  if (visit.status === "COMPLETED" || visit.status === "CANCELLED") {
    return { ok: false, message: "Esta visita ya está cerrada." };
  }

  const when = parseScheduledAt(scheduledAtISO);
  if (!when.ok) return { ok: false, message: when.message };

  const patch: Record<string, unknown> = { scheduled_at: when.iso, status: "SCHEDULED" };
  const trimmedNotes = notes?.trim();
  if (trimmedNotes) patch.notes = trimmedNotes;

  const { error } = await admin.from("visits").update(patch).eq("id", visitId);
  if (error) return { ok: false, message: error.message };

  await logActivity(admin, {
    leadId: visit.leadId,
    type: "visit_scheduled",
    title: `Visita agendada para ${describeWhen(when.iso)}`,
    body: trimmedNotes || null,
    user,
    metadata: { visitId, scheduledAt: when.iso },
  });
  await advanceLeadStatus(admin, visit.leadId, visit.leadStatus, ["NEW", "CONTACTED", "QUALIFIED"], "VISIT_SCHEDULED");
  await notifyContactScheduled(visit.leadId, visitId, visit.propertyTitle, when.iso);

  revalidateVisitPaths(visit.leadId);
  return { ok: true };
}

/** Marca la visita como realizada. */
export async function completeVisit(visitId: string): Promise<VisitActionResult> {
  const { user, admin, visit, allowed } = await loadVisitForUser(visitId);
  if (!allowed || !admin || !visit || !user) return { ok: false, message: "No autorizado." };
  if (visit.status === "CANCELLED") return { ok: false, message: "La visita fue cancelada." };

  const { error } = await admin.from("visits").update({ status: "COMPLETED" }).eq("id", visitId);
  if (error) return { ok: false, message: error.message };

  await logActivity(admin, {
    leadId: visit.leadId,
    type: "visit_completed",
    title: "Visita realizada",
    body: visit.scheduledAt ? describeWhen(visit.scheduledAt) : null,
    user,
    metadata: { visitId },
  });
  await advanceLeadStatus(admin, visit.leadId, visit.leadStatus, ["VISIT_SCHEDULED"], "VISIT_COMPLETED");

  revalidateVisitPaths(visit.leadId);
  return { ok: true };
}

/** El cliente no se presentó. */
export async function markNoShow(visitId: string): Promise<VisitActionResult> {
  const { user, admin, visit, allowed } = await loadVisitForUser(visitId);
  if (!allowed || !admin || !visit || !user) return { ok: false, message: "No autorizado." };
  if (visit.status === "CANCELLED") return { ok: false, message: "La visita fue cancelada." };

  const { error } = await admin.from("visits").update({ status: "NO_SHOW" }).eq("id", visitId);
  if (error) return { ok: false, message: error.message };

  await logActivity(admin, {
    leadId: visit.leadId,
    type: "visit_no_show",
    title: "El cliente no asistió a la visita",
    body: visit.scheduledAt ? describeWhen(visit.scheduledAt) : null,
    user,
    metadata: { visitId },
  });

  revalidateVisitPaths(visit.leadId);
  return { ok: true };
}

/**
 * Cancela la visita. Además del asesor/agencia/staff, puede cancelar el propio
 * cliente (dueño del contacto del lead); en ese caso se avisa al asesor.
 */
export async function cancelVisit(visitId: string, reason?: string): Promise<VisitActionResult> {
  const { user, admin, visit, allowed } = await loadVisitForUser(visitId, { allowContact: true });
  if (!allowed || !admin || !visit || !user) return { ok: false, message: "No autorizado." };
  if (visit.status === "CANCELLED") return { ok: true };
  if (visit.status === "COMPLETED") return { ok: false, message: "La visita ya fue realizada." };

  const { error } = await admin.from("visits").update({ status: "CANCELLED" }).eq("id", visitId);
  if (error) return { ok: false, message: error.message };

  const trimmedReason = reason?.trim() || null;
  const byContact = !canManage(user, { agentId: visit.agentId, agencyId: visit.leadAgencyId });
  const when = visit.scheduledAt ? describeWhen(visit.scheduledAt) : null;

  await logActivity(admin, {
    leadId: visit.leadId,
    type: "visit_cancelled",
    title: byContact ? "El cliente canceló la visita" : "Visita cancelada",
    body: [when, trimmedReason].filter(Boolean).join(" · ") || null,
    user,
    metadata: { visitId, byContact },
  });

  const body = [visit.propertyTitle ?? "Propiedad", when].filter(Boolean).join(" — ");
  if (byContact) {
    await notifyAgent(visit.agentId, {
      type: "visit_cancelled",
      title: "El cliente canceló una visita",
      body: trimmedReason ? `${body}. Motivo: ${trimmedReason}` : body,
      payload: { visitId, leadId: visit.leadId, href: "/agent/dashboard/calendar" },
    });
  } else {
    await notifyLeadContact(visit.leadId, {
      type: "visit_cancelled",
      title: "Tu visita fue cancelada",
      body: trimmedReason ? `${body}. Motivo: ${trimmedReason}` : body,
      payload: { visitId, leadId: visit.leadId, href: "/dashboard/visits" },
      email: true,
    });
  }

  revalidateVisitPaths(visit.leadId);
  return { ok: true };
}

/**
 * Visita iniciada por el asesor desde el lead. Con fecha → SCHEDULED (misma
 * actividad y notificación que `scheduleVisit`); sin fecha → REQUESTED.
 */
export async function createVisitForLead(
  leadId: string,
  scheduledAtISO?: string | null,
  notes?: string,
): Promise<VisitActionResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id, agent_id, agency_id, property_id, unit_id, status, property:properties(title)")
    .eq("id", leadId)
    .maybeSingle();
  if (leadError || !lead) return { ok: false, message: "Lead no encontrado." };

  if (!canManage(user, { agentId: lead.agent_id, agencyId: lead.agency_id })) {
    return { ok: false, message: "No autorizado." };
  }

  let iso: string | null = null;
  if (scheduledAtISO) {
    const when = parseScheduledAt(scheduledAtISO);
    if (!when.ok) return { ok: false, message: when.message };
    iso = when.iso;
  }

  const trimmedNotes = notes?.trim() || null;
  // El agente de la visita es el del lead; si el lead no tiene asesor, el propio usuario (si lo es).
  const agentId = (lead.agent_id as string | null) ?? user.agentId ?? null;

  const { data: created, error } = await admin
    .from("visits")
    .insert({
      visit_code: "", // lo rellena el trigger assign_visit_code()
      lead_id: leadId,
      property_id: lead.property_id ?? null,
      unit_id: lead.unit_id ?? null,
      agent_id: agentId,
      scheduled_at: iso,
      status: iso ? "SCHEDULED" : "REQUESTED",
      notes: trimmedNotes,
    })
    .select("id")
    .single();
  if (error || !created) return { ok: false, message: error?.message ?? "No se pudo crear la visita." };

  const propertyTitle = ((lead as any).property?.title as string | null | undefined) ?? null;

  if (iso) {
    await logActivity(admin, {
      leadId,
      type: "visit_scheduled",
      title: `Visita agendada para ${describeWhen(iso)}`,
      body: trimmedNotes,
      user,
      metadata: { visitId: created.id, scheduledAt: iso },
    });
    await advanceLeadStatus(admin, leadId, lead.status, ["NEW", "CONTACTED", "QUALIFIED"], "VISIT_SCHEDULED");
    await notifyContactScheduled(leadId, created.id, propertyTitle, iso);
  } else {
    await logActivity(admin, {
      leadId,
      type: "visit_requested",
      title: "Visita pendiente de confirmar fecha",
      body: trimmedNotes,
      user,
      metadata: { visitId: created.id },
    });
  }

  revalidateVisitPaths(leadId);
  return { ok: true, message: iso ? "Visita agendada." : "Visita creada; confirma la fecha desde la agenda." };
}
