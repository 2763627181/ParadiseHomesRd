import "server-only";

import { env, serverEnv } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Notificaciones: siempre se crea la fila in-app en `notifications`; si hay
 * `RESEND_API_KEY` configurada, además se envía un correo (Resend REST API,
 * sin dependencia extra). Sin la key, el correo se omite silenciosamente —
 * la app nunca falla por falta de proveedor de email.
 *
 * Tipos usados hoy: lead_new, message_new, visit_scheduled, visit_cancelled,
 * property_approved, property_rejected, closing_registered.
 */

export interface NotifyInput {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  /** datos para deep-link (p. ej. { leadId, conversationId, href }) */
  payload?: Record<string, unknown>;
  /** si se pasa, además del in-app se intenta enviar correo */
  email?: { subject?: string; html?: string } | boolean;
}

export async function notifyUser(input: NotifyInput): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) return;

  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    channel: "in_app",
    title: input.title,
    body: input.body ?? null,
    payload: input.payload ?? {},
  });
  if (error) console.error("[notifyUser]", error.message);

  if (input.email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", input.userId)
      .maybeSingle();
    if (profile?.email) {
      const opts = typeof input.email === "object" ? input.email : {};
      const href = typeof input.payload?.href === "string" ? `${env.APP_URL}${input.payload.href}` : env.APP_URL;
      await sendEmail({
        to: profile.email,
        subject: opts.subject ?? input.title,
        html:
          opts.html ??
          `<p>Hola ${escapeHtml(profile.full_name ?? "")},</p>
           <p><strong>${escapeHtml(input.title)}</strong></p>
           ${input.body ? `<p>${escapeHtml(input.body)}</p>` : ""}
           <p><a href="${href}">Ver en ${escapeHtml(env.APP_NAME)}</a></p>`,
      });
    }
  }
}

/** Notifica al perfil vinculado a un agente (`agents.profile_id`). No hace nada si no tiene cuenta. */
export async function notifyAgent(agentId: string | null | undefined, input: Omit<NotifyInput, "userId">) {
  if (!agentId) return;
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const { data } = await admin.from("agents").select("profile_id").eq("id", agentId).maybeSingle();
  if (data?.profile_id) await notifyUser({ ...input, userId: data.profile_id });
}

/** Notifica al cliente de un lead (`contacts.profile_id`). No hace nada si el lead fue anónimo. */
export async function notifyLeadContact(leadId: string, input: Omit<NotifyInput, "userId">) {
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const { data } = await admin
    .from("leads")
    .select("contact:contacts(profile_id)")
    .eq("id", leadId)
    .maybeSingle();
  const profileId = (data as any)?.contact?.profile_id as string | null | undefined;
  if (profileId) await notifyUser({ ...input, userId: profileId });
}

/** Notifica a todos los admins/super admins (p. ej. cierre registrado, nueva solicitud de socio). */
export async function notifyStaff(input: Omit<NotifyInput, "userId">) {
  const admin = getSupabaseAdminClient();
  if (!admin) return;
  const { data } = await admin.from("profiles").select("id").in("role", ["ADMIN", "SUPER_ADMIN"]).limit(50);
  await Promise.all((data ?? []).map((p: any) => notifyUser({ ...input, userId: p.id })));
}

/** Envío por Resend (https://resend.com/docs/api-reference/emails/send-email). No-op sin API key. */
export async function sendEmail(input: { to: string; subject: string; html: string }): Promise<boolean> {
  const key = serverEnv.RESEND_API_KEY;
  if (!key) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: serverEnv.RESEND_FROM_EMAIL, to: [input.to], subject: input.subject, html: input.html }),
    });
    if (!res.ok) console.error("[sendEmail]", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[sendEmail]", err);
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
