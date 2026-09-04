"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface VerificationResult {
  ok: boolean;
  message?: string;
}

async function guard() {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return { user: null, denied: true as const };
  return { user, denied: false as const };
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

  revalidatePath("/admin/verifications");
  revalidatePath("/agencies");
  return { ok: true };
}
