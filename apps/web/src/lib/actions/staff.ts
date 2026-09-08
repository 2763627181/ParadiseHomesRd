"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface StaffActionResult {
  ok: boolean;
  message?: string;
}

/**
 * Gestión de staff. Solo SUPER_ADMIN. Puede promover un `USER` a `ADMIN` y
 * degradar un `ADMIN` a `USER`. Nunca toca cuentas SUPER_ADMIN ni la propia.
 */
async function guardSuper() {
  const user = await getSessionUser();
  if (user?.role !== "SUPER_ADMIN") return null;
  return user;
}

export async function promoteToAdmin(email: string): Promise<StaffActionResult> {
  const me = await guardSuper();
  if (!me) return { ok: false, message: "Solo un super admin puede gestionar staff." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, message: "Ingresa un correo." };

  const { data: profile } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .ilike("email", clean)
    .maybeSingle();
  if (!profile) {
    return { ok: false, message: "No hay ninguna cuenta con ese correo. La persona debe registrarse primero." };
  }
  if (profile.role === "SUPER_ADMIN" || profile.role === "ADMIN") {
    return { ok: false, message: `${profile.full_name} ya es staff.` };
  }

  const { error } = await admin.from("profiles").update({ role: "ADMIN" }).eq("id", profile.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/users");
  return { ok: true, message: `${profile.full_name} ahora es administrador.` };
}

export async function revokeAdmin(userId: string): Promise<StaffActionResult> {
  const me = await guardSuper();
  if (!me) return { ok: false, message: "Solo un super admin puede gestionar staff." };
  if (userId === me.id) return { ok: false, message: "No puedes quitarte tus propios permisos." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: profile } = await admin.from("profiles").select("role, full_name").eq("id", userId).maybeSingle();
  if (!profile) return { ok: false, message: "Cuenta no encontrada." };
  if (profile.role === "SUPER_ADMIN") return { ok: false, message: "No se puede degradar a un super admin." };
  if (profile.role !== "ADMIN") return { ok: false, message: `${profile.full_name} no es administrador.` };

  const { error } = await admin.from("profiles").update({ role: "USER" }).eq("id", userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/users");
  return { ok: true, message: `Se le quitaron los permisos de admin a ${profile.full_name}.` };
}
