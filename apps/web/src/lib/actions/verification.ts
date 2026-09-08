"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { notifyAgent, notifyUser } from "@/lib/notify";

export interface VerificationResult {
  ok: boolean;
  message?: string;
}

async function guard() {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return { user: null, denied: true as const };
  return { user, denied: false as const };
}

const VERIFIED_PAYLOAD = {
  type: "verified",
  title: "¡Ya tienes el sello Paradise Verified!",
  email: true as const,
};

/** Avisa al owner/admin de una organización tras verificarla. */
async function notifyOrgOwner(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  column: "agency_id" | "developer_id",
  orgId: string,
  body: string,
): Promise<void> {
  try {
    const { data } = await admin
      .from("organization_members")
      .select("profile_id")
      .eq(column, orgId)
      .in("role", ["owner", "admin"])
      .limit(10);
    for (const m of (data ?? []) as any[]) {
      if (m.profile_id) await notifyUser({ userId: m.profile_id, body, ...VERIFIED_PAYLOAD });
    }
  } catch (err) {
    console.error("[notifyOrgOwner]", err);
  }
}

export async function verifyProperty(id: string): Promise<VerificationResult> {
  const { user, denied } = await guard();
  if (denied) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("properties")
    .update({
      is_verified: true,
      verified_at: now,
      verified_by: user!.id,
      last_verified_at: now,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  try {
    const { data } = await admin
      .from("properties")
      .select("owner_profile_id, agent_id, slug, title")
      .eq("id", id)
      .maybeSingle();
    const p = data as any;
    if (p?.owner_profile_id)
      await notifyUser({
        userId: p.owner_profile_id,
        body: p.title,
        payload: { propertyId: id, href: `/property/${p.slug}` },
        ...VERIFIED_PAYLOAD,
      });
    if (p?.agent_id)
      await notifyAgent(p.agent_id, {
        body: p.title,
        payload: { propertyId: id, href: `/property/${p.slug}` },
        ...VERIFIED_PAYLOAD,
      });
  } catch (err) {
    console.error("[verifyProperty:notify]", err);
  }

  revalidatePath("/admin/verifications");
  revalidatePath("/properties");
  return { ok: true };
}

export async function verifyAgent(id: string): Promise<VerificationResult> {
  const { user, denied } = await guard();
  if (denied) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("agents")
    .update({ is_verified: true, verified_at: now, verified_by: user!.id })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  try {
    const { data } = await admin.from("agents").select("profile_id, full_name, slug").eq("id", id).maybeSingle();
    const a = data as any;
    if (a?.profile_id)
      await notifyUser({
        userId: a.profile_id,
        body: "Tu perfil de asesor ya aparece verificado.",
        payload: { href: `/agent/${a.slug}` },
        ...VERIFIED_PAYLOAD,
      });
  } catch (err) {
    console.error("[verifyAgent:notify]", err);
  }

  revalidatePath("/admin/verifications");
  revalidatePath("/agents");
  return { ok: true };
}

export async function verifyAgency(id: string): Promise<VerificationResult> {
  const { user, denied } = await guard();
  if (denied) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("agencies")
    .update({ is_verified: true, verified_at: now, verified_by: user!.id })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  await notifyOrgOwner(admin, "agency_id", id, "Tu inmobiliaria ya aparece verificada en Paradise Homes RD.");

  revalidatePath("/admin/verifications");
  revalidatePath("/agencies");
  return { ok: true };
}
