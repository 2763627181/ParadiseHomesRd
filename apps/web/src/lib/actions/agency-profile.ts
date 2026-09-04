"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isAgencyUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

function canManageAgency(
  user: Awaited<ReturnType<typeof getSessionUser>>,
  agencyId: string,
): boolean {
  if (!user) return false;
  return (
    isAgencyUser(user) &&
    user.memberships.some((m) => m.organizationType === "agency" && m.organizationId === agencyId)
  );
}

/** Actualiza el perfil público de la inmobiliaria. */
export async function updateAgencyProfile(
  agencyId: string,
  input: {
    name: string;
    description: string;
    logoUrl: string;
    coverImageUrl: string;
    website: string;
    phone: string;
    email: string;
  },
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!canManageAgency(user, agencyId)) return { ok: false, message: "No autorizado." };
  if (!input.name.trim()) return { ok: false, message: "El nombre es obligatorio." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data, error } = await admin
    .from("agencies")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      logo_url: input.logoUrl.trim() || null,
      cover_image_url: input.coverImageUrl.trim() || null,
      website: input.website.trim() || null,
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
    })
    .eq("id", agencyId)
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/agency/dashboard/settings");
  if (data?.slug) revalidatePath(`/agency/${data.slug}`);
  return { ok: true };
}
