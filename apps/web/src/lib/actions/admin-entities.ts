"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface AdminActionResult {
  ok: boolean;
  message?: string;
}

/**
 * Eliminación de entidades desde el panel de admin. Solo staff.
 *
 * Las claves foráneas de propiedades/leads hacia agencias, agentes y
 * desarrolladoras son `on delete set null`, así que borrar una de estas
 * entidades NO borra sus propiedades ni sus leads: solo los desvincula. Borrar
 * una propiedad o un proyecto sí arrastra sus fotos, unidades y planes de pago
 * (`on delete cascade`).
 */
async function guard() {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return null;
  return user;
}

async function del(
  table: "properties" | "projects" | "agencies" | "agents" | "developers",
  id: string,
  paths: string[],
): Promise<AdminActionResult> {
  const user = await guard();
  if (!user) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  for (const p of paths) revalidatePath(p);
  return { ok: true, message: "Eliminado." };
}

export async function deleteProperty(id: string): Promise<AdminActionResult> {
  return del("properties", id, ["/admin/properties", "/properties"]);
}

export async function deleteProject(id: string): Promise<AdminActionResult> {
  return del("projects", id, ["/admin/projects", "/projects"]);
}

export async function deleteAgency(id: string): Promise<AdminActionResult> {
  return del("agencies", id, ["/admin/agencies", "/agencies"]);
}

export async function deleteAgent(id: string): Promise<AdminActionResult> {
  return del("agents", id, ["/admin/agents", "/agents"]);
}

export async function deleteDeveloper(id: string): Promise<AdminActionResult> {
  return del("developers", id, ["/admin/developers", "/developers"]);
}
