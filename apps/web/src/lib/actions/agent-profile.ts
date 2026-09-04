"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/** Actualiza los datos públicos del asesor (nombre, título, bio, contacto, avatar). */
export async function updateAgentProfile(input: {
  fullName: string;
  title: string;
  bio: string;
  phone: string;
  whatsapp: string;
  avatarUrl: string;
}): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user?.agentId) return { ok: false, message: "No autorizado." };
  if (!input.fullName.trim()) return { ok: false, message: "El nombre es obligatorio." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data, error } = await admin
    .from("agents")
    .update({
      full_name: input.fullName.trim(),
      title: input.title.trim() || null,
      bio: input.bio.trim() || null,
      phone: input.phone.trim() || null,
      whatsapp: input.whatsapp.trim() || null,
      avatar_url: input.avatarUrl.trim() || null,
    })
    .eq("id", user.agentId)
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/agent/dashboard/profile");
  if (data?.slug) revalidatePath(`/agent/${data.slug}`);
  return { ok: true };
}

/** Actualiza idiomas y zonas de cobertura del asesor. */
export async function updateAgentSettings(input: {
  languages: string[];
  areas: string[];
}): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user?.agentId) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data, error } = await admin
    .from("agents")
    .update({
      languages: input.languages.length ? input.languages : ["Español"],
      areas: input.areas,
    })
    .eq("id", user.agentId)
    .select("slug")
    .maybeSingle();
  if (error) return { ok: false, message: error.message };

  revalidatePath("/agent/dashboard/settings");
  if (data?.slug) revalidatePath(`/agent/${data.slug}`);
  return { ok: true };
}
