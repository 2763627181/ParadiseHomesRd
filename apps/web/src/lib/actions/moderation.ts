"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { notifyAgent, notifyUser } from "@/lib/notify";

export interface ModerationResult {
  ok: boolean;
  message?: string;
}

/** Avisa al dueño del perfil y al agente (si es distinto) sobre el resultado de moderación. */
async function notifyPropertyOwners(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  propertyId: string,
  outcome: "approved" | "rejected",
  rejectReason?: string,
): Promise<void> {
  try {
    const { data } = await admin
      .from("properties")
      .select("owner_profile_id, agent_id, slug, title")
      .eq("id", propertyId)
      .maybeSingle();
    if (!data) return;
    const p = data as any;

    const payload =
      outcome === "approved"
        ? {
            type: "property_approved",
            title: "Tu propiedad fue aprobada",
            body: p.title as string,
            payload: { propertyId, href: `/property/${p.slug}` },
          }
        : {
            type: "property_rejected",
            title: "Tu propiedad necesita cambios",
            body: (rejectReason ?? "Revisa los comentarios del equipo.") as string,
            payload: { propertyId, href: `/list-property?edit=${propertyId}` },
          };

    if (p.owner_profile_id) await notifyUser({ userId: p.owner_profile_id, email: true, ...payload });
    if (p.agent_id) await notifyAgent(p.agent_id, { email: true, ...payload });
  } catch (err) {
    console.error("[notifyPropertyOwners]", err);
  }
}

async function guard() {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return { user: null, denied: true as const };
  return { user, denied: false as const };
}

export async function approveProperty(id: string): Promise<ModerationResult> {
  const { user, denied } = await guard();
  if (denied) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("properties")
    .update({
      status: "PUBLISHED",
      moderation_state: "PUBLISHED",
      is_verified: true,
      verified_at: now,
      verified_by: user!.id,
      published_at: now,
      last_verified_at: now,
      reject_reason: null,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await admin.from("moderation_log").insert({
    entity_type: "property",
    entity_id: id,
    to_state: "PUBLISHED",
    actor_id: user!.id,
    reason: "Aprobada y verificada",
  });

  await notifyPropertyOwners(admin, id, "approved");

  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  return { ok: true };
}

export async function rejectProperty(id: string, reason: string): Promise<ModerationResult> {
  const { user, denied } = await guard();
  if (denied) return { ok: false, message: "No autorizado." };
  if (!reason.trim()) return { ok: false, message: "Indica el motivo del rechazo." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { error } = await admin
    .from("properties")
    .update({
      status: "REJECTED",
      moderation_state: "REJECTED",
      reject_reason: reason.trim(),
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await admin.from("moderation_log").insert({
    entity_type: "property",
    entity_id: id,
    to_state: "REJECTED",
    actor_id: user!.id,
    reason: reason.trim(),
  });

  await notifyPropertyOwners(admin, id, "rejected", reason.trim());

  revalidatePath("/admin/properties");
  return { ok: true };
}

export async function unpublishProperty(id: string): Promise<ModerationResult> {
  const { user, denied } = await guard();
  if (denied) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { error } = await admin
    .from("properties")
    .update({ status: "ARCHIVED", moderation_state: "ARCHIVED" })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await admin.from("moderation_log").insert({
    entity_type: "property",
    entity_id: id,
    to_state: "ARCHIVED",
    actor_id: user!.id,
  });

  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  return { ok: true };
}
