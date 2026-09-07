"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface NotificationActionResult {
  ok: boolean;
  message?: string;
}

const UNAUTHORIZED: NotificationActionResult = { ok: false, message: "Inicia sesión para continuar." };

/** Marca una notificación propia como leída (idempotente). */
export async function markNotificationRead(id: string): Promise<NotificationActionResult> {
  const user = await getSessionUser();
  if (!user) return UNAUTHORIZED;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Servicio no disponible." };

  // RLS (`notifications_own_update`) ya limita esto a `user_id = auth.uid()`;
  // el filtro explícito es una segunda capa de defensa, no la única.
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/notifications");
  return { ok: true };
}

/** Marca todas las notificaciones pendientes del usuario como leídas. */
export async function markAllNotificationsRead(): Promise<NotificationActionResult> {
  const user = await getSessionUser();
  if (!user) return UNAUTHORIZED;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Servicio no disponible." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/notifications");
  return { ok: true };
}
