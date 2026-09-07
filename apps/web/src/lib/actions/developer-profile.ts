"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isAgencyUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

function canManageDeveloper(
  user: Awaited<ReturnType<typeof getSessionUser>>,
  developerId: string,
): boolean {
  if (!user) return false;
  // `isAgencyUser` ya devuelve true para el rol DEVELOPER_ADMIN (mal nombrado,
  // pero cubre ambos tipos de administrador de organización).
  return (
    isAgencyUser(user) &&
    user.memberships.some(
      (m) => m.organizationType === "developer" && m.organizationId === developerId,
    )
  );
}

/** Actualiza el perfil público de la desarrolladora (sin correo — no hay columna `email`). */
export async function updateDeveloperProfile(
  developerId: string,
  input: {
    name: string;
    description: string;
    logoUrl: string;
    coverImageUrl: string;
    website: string;
    phone: string;
    whatsapp: string;
  },
): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!canManageDeveloper(user, developerId)) return { ok: false, message: "No autorizado." };
  if (!input.name.trim()) return { ok: false, message: "El nombre es obligatorio." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data, error } = await admin
    .from("developers")
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      logo_url: input.logoUrl.trim() || null,
      cover_image_url: input.coverImageUrl.trim() || null,
      website: input.website.trim() || null,
      phone: input.phone.trim() || null,
      whatsapp: input.whatsapp.trim() || null,
    })
    .eq("id", developerId)
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/developer/dashboard/settings");
  if (data?.slug) revalidatePath(`/developers/${data.slug}`);
  return { ok: true };
}
