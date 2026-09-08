"use server";

import { cookies, headers } from "next/headers";
import {
  ATTRIBUTION_COOKIE,
  deriveLeadSource,
  parseAttribution,
} from "@paradise/utils/attribution";
import { formatLeadCode } from "@paradise/utils/codes";
import { leadFormSchema, scheduleVisitSchema } from "@paradise/validation";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";
import { notifyAgent } from "@/lib/notify";

export interface LeadActionResult {
  ok: boolean;
  leadCode?: string;
  leadId?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

async function resolveAttribution() {
  const cookieStore = await cookies();
  const snapshot = parseAttribution(cookieStore.get(ATTRIBUTION_COOKIE)?.value ?? null);
  const source = snapshot ? snapshot.source : "direct";
  return { snapshot, source };
}

export async function submitLead(input: unknown): Promise<LeadActionResult> {
  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos del formulario", fieldErrors: flatten(parsed.error) };
  }
  const data = parsed.data;

  // Honeypot
  if (data.website) return { ok: true, leadCode: "PH-L-000000" };

  const { snapshot, source } = await resolveAttribution();
  const hdrs = await headers();
  const referrer = hdrs.get("referer");

  if (!isSupabaseConfigured) {
    const demoCode = formatLeadCode(Math.floor(Math.random() * 900000) + 100000);
    console.info("[lead:demo]", {
      code: demoCode,
      name: data.fullName,
      phone: data.phone,
      propertyCode: data.propertyCode,
      channel: data.channel,
      source,
      referrer,
    });
    return { ok: true, leadCode: demoCode };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "El servicio no está disponible en este momento." };

  try {
    // upsert contacto (dedupe por teléfono)
    const { data: contact, error: contactError } = await admin
      .from("contacts")
      .upsert(
        { full_name: data.fullName, phone: data.phone, email: data.email ?? null, whatsapp: data.phone },
        { onConflict: "phone" },
      )
      .select("id")
      .single();
    if (contactError || !contact) throw contactError ?? new Error("contact");

    const { data: lead, error: leadError } = await admin
      .from("leads")
      .insert({
        contact_id: contact.id,
        property_id: data.propertyId ?? null,
        project_id: data.projectId ?? null,
        unit_id: data.unitId ?? null,
        agent_id: data.agentId ?? null,
        agency_id: data.agencyId ?? null,
        source: source === "direct" ? deriveLeadSource(snapshot?.lastTouch ?? {}) : source,
        channel: data.channel,
        intent: data.intent,
        message: data.message ?? null,
        utm_source: snapshot?.lastTouch.utmSource ?? null,
        utm_medium: snapshot?.lastTouch.utmMedium ?? null,
        utm_campaign: snapshot?.lastTouch.utmCampaign ?? null,
        utm_content: snapshot?.lastTouch.utmContent ?? null,
        utm_term: snapshot?.lastTouch.utmTerm ?? null,
        referrer: snapshot?.lastTouch.referrer ?? referrer ?? null,
        landing_page: snapshot?.firstTouch.landingPage ?? null,
        first_touch: snapshot?.firstTouch ?? null,
        last_touch: snapshot?.lastTouch ?? null,
      })
      .select("id, lead_code")
      .single();
    if (leadError || !lead) throw leadError ?? new Error("lead");

    // Post-proceso: enlazar cuenta, abrir conversación y avisar al asesor.
    // Un fallo aquí nunca invalida el lead ya creado.
    try {
      const sessionUser = await getSessionUser();
      if (sessionUser) {
        await admin
          .from("contacts")
          .update({ profile_id: sessionUser.id })
          .eq("id", contact.id)
          .is("profile_id", null);

        const { data: conv } = await admin
          .from("conversations")
          .insert({
            lead_id: lead.id,
            property_id: data.propertyId ?? null,
            agent_id: data.agentId ?? null,
            buyer_id: sessionUser.id,
          })
          .select("id")
          .single();
        if (conv?.id && data.message?.trim()) {
          await admin.from("messages").insert({
            conversation_id: conv.id,
            sender_id: sessionUser.id,
            body: data.message.trim(),
          });
          await admin.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conv.id);
        }
      }

      if (data.agentId) {
        await notifyAgent(data.agentId, {
          type: "lead_new",
          title: `Nuevo lead: ${data.fullName}`,
          body: data.message?.trim() || `Consulta ${data.propertyCode ?? ""}`.trim() || "Nueva consulta",
          payload: { leadId: lead.id, href: `/agent/dashboard/leads/${lead.id}` },
          email: true,
        });
      }
    } catch (postErr) {
      console.error("[lead] post-proceso", postErr);
    }

    return { ok: true, leadCode: lead.lead_code, leadId: lead.id };
  } catch (error) {
    console.error("[lead] error", error);
    return { ok: false, message: "No pudimos registrar tu solicitud. Intenta por WhatsApp." };
  }
}

export async function submitVisitRequest(input: unknown): Promise<LeadActionResult> {
  const parsed = scheduleVisitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos", fieldErrors: flatten(parsed.error) };
  }
  const data = parsed.data;
  if (data.website) return { ok: true, leadCode: "PH-L-000000" };

  const result = await submitLead({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    message: `Solicitud de visita — ${data.preferredDate} (${data.preferredTimeSlot}). ${data.notes ?? ""}`.trim(),
    intent: "visit",
    channel: "schedule_visit",
    propertyId: data.propertyId,
    propertyCode: data.propertyCode,
    unitId: data.unitId,
    projectId: data.projectId,
    agentId: data.agentId,
    consent: data.consent,
  });

  // Además del lead, deja constancia de la visita pedida para la agenda del asesor.
  if (result.ok && result.leadId && isSupabaseConfigured) {
    try {
      const admin = getSupabaseAdminClient();
      await admin?.from("visits").insert({
        visit_code: "",
        lead_id: result.leadId,
        property_id: data.propertyId ?? null,
        unit_id: data.unitId ?? null,
        agent_id: data.agentId ?? null,
        status: "REQUESTED",
        notes: `Preferencia: ${data.preferredDate} (${data.preferredTimeSlot}). ${data.notes ?? ""}`.trim(),
      });
    } catch (err) {
      console.error("[visit] insert", err);
    }
  }

  return result;
}

function flatten(error: { issues: { path: PropertyKey[]; message: string }[] }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
