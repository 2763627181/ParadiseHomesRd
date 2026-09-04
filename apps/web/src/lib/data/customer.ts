import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AlertFrequency, LeadStatus, VisitStatus } from "@paradise/config";
import type { PropertySearchParams } from "@paradise/types";

import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ─────────────────────────────────────────────────────────────────────────────
 * Capa de datos para el panel del usuario ("mi cuenta"): búsquedas guardadas,
 * consultas (leads) y visitas propias, y su perfil. A diferencia de
 * `lib/data/leads.ts` (CRM de agente/agencia/admin, siempre con cliente admin),
 * aquí las filas pertenecen al usuario autenticado, así que usamos el cliente
 * server (respeta RLS) salvo en `visits`, cuya política RLS no cubre la
 * visibilidad propia del cliente — ver nota en `getUserVisits`.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface CustomerSavedSearch {
  id: string;
  name: string;
  params: PropertySearchParams;
  alertFrequency: AlertFrequency;
  createdAt: string;
  lastRunAt: string | null;
}

export async function getSavedSearchesForUser(userId: string): Promise<CustomerSavedSearch[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, name, params, alert_frequency, created_at, last_run_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getSavedSearchesForUser]", error.message);
    return [];
  }

  return (data ?? []).map(
    (row: any): CustomerSavedSearch => ({
      id: row.id,
      name: row.name,
      params: (row.params ?? {}) as PropertySearchParams,
      alertFrequency: row.alert_frequency as AlertFrequency,
      createdAt: row.created_at,
      lastRunAt: row.last_run_at,
    }),
  );
}

/** ids de `contacts` que pertenecen a este perfil (para acotar leads/visits). */
async function getOwnContactIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("contacts").select("id").eq("profile_id", userId);
  if (error) {
    console.error("[getOwnContactIds]", error.message);
    return [];
  }
  return (data ?? []).map((r: any) => r.id as string);
}

export interface CustomerInquiry {
  id: string;
  leadCode: string;
  status: LeadStatus;
  message: string | null;
  createdAt: string;
  propertyTitle: string | null;
  propertySlug: string | null;
  projectName: string | null;
  projectSlug: string | null;
  agentName: string | null;
  agentPhone: string | null;
  agentWhatsapp: string | null;
}

const INQUIRY_SELECT = `
  id, lead_code, status, message, created_at,
  property:properties(title, slug),
  project:projects(name, slug),
  agent:agents(full_name, phone, whatsapp)
`;

function mapInquiry(row: any): CustomerInquiry {
  return {
    id: row.id,
    leadCode: row.lead_code,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    propertyTitle: row.property?.title ?? null,
    propertySlug: row.property?.slug ?? null,
    projectName: row.project?.name ?? null,
    projectSlug: row.project?.slug ?? null,
    agentName: row.agent?.full_name ?? null,
    agentPhone: row.agent?.phone ?? null,
    agentWhatsapp: row.agent?.whatsapp ?? null,
  };
}

/** Consultas (leads) enviadas POR este usuario, vía `contacts.profile_id`. */
export async function getUserInquiries(userId: string): Promise<CustomerInquiry[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const contactIds = await getOwnContactIds(supabase, userId);
  if (contactIds.length === 0) return [];

  const { data, error } = await supabase
    .from("leads")
    .select(INQUIRY_SELECT)
    .in("contact_id", contactIds)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[getUserInquiries]", error.message);
    return [];
  }

  return (data ?? []).map(mapInquiry);
}

export interface CustomerVisit {
  id: string;
  visitCode: string;
  status: VisitStatus;
  scheduledAt: string | null;
  notes: string | null;
  createdAt: string;
  propertyTitle: string | null;
  propertySlug: string | null;
  agentName: string | null;
  agentPhone: string | null;
  agentWhatsapp: string | null;
}

const VISIT_SELECT = `
  id, visit_code, scheduled_at, status, notes, created_at,
  property:properties(title, slug),
  agent:agents(full_name, phone, whatsapp)
`;

function mapVisit(row: any): CustomerVisit {
  return {
    id: row.id,
    visitCode: row.visit_code,
    status: row.status,
    scheduledAt: row.scheduled_at,
    notes: row.notes,
    createdAt: row.created_at,
    propertyTitle: row.property?.title ?? null,
    propertySlug: row.property?.slug ?? null,
    agentName: row.agent?.full_name ?? null,
    agentPhone: row.agent?.phone ?? null,
    agentWhatsapp: row.agent?.whatsapp ?? null,
  };
}

/**
 * Visitas agendadas para este usuario, vía `visits.lead_id -> leads.contact_id
 * -> contacts.profile_id`. La política RLS `visits_visibility` solo cubre
 * staff / agente asignado / agencia-desarrolladora dueña — no tiene cláusula
 * de "dueño del contacto" — así que un cliente normal no puede leer sus
 * propias visitas con el cliente server. Usamos el cliente admin, pero de
 * forma segura: `leadIds` sale de una consulta a `leads` que sí respeta RLS
 * (contact_belongs_to_user), o sea ya están acotados a los leads de ESTE
 * usuario antes de tocar `visits`.
 */
export async function getUserVisits(userId: string): Promise<CustomerVisit[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const contactIds = await getOwnContactIds(supabase, userId);
  if (contactIds.length === 0) return [];

  const { data: leadRows, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .in("contact_id", contactIds);
  if (leadError) {
    console.error("[getUserVisits] leads", leadError.message);
    return [];
  }
  const leadIds = (leadRows ?? []).map((r: any) => r.id as string);
  if (leadIds.length === 0) return [];

  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("visits")
    .select(VISIT_SELECT)
    .in("lead_id", leadIds)
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (error) {
    console.error("[getUserVisits] visits", error.message);
    return [];
  }

  return (data ?? []).map(mapVisit);
}

export interface CustomerProfile {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfile | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, whatsapp")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp,
  };
}
