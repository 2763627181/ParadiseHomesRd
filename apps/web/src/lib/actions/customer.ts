"use server";

import { revalidatePath } from "next/cache";
import { ALERT_FREQUENCY, type AlertFrequency } from "@paradise/config";
import { updateProfileSchema } from "@paradise/validation";

import { getSessionUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface CustomerActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

const UNAUTHORIZED: CustomerActionResult = { ok: false, message: "Inicia sesión para continuar." };

export async function deleteSavedSearch(id: string): Promise<CustomerActionResult> {
  const user = await getSessionUser();
  if (!user) return UNAUTHORIZED;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Servicio no disponible." };

  // RLS (`saved_searches_own`) ya limita esto a `user_id = auth.uid()`; el
  // filtro explícito es una segunda capa de defensa, no la única.
  const { error } = await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/searches");
  revalidatePath("/dashboard/alerts");
  return { ok: true };
}

export async function updateSavedSearchAlertFrequency(
  id: string,
  alertFrequency: AlertFrequency,
): Promise<CustomerActionResult> {
  const user = await getSessionUser();
  if (!user) return UNAUTHORIZED;

  if (!Object.values(ALERT_FREQUENCY).includes(alertFrequency)) {
    return { ok: false, message: "Frecuencia no válida." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Servicio no disponible." };

  const { error } = await supabase
    .from("saved_searches")
    .update({ alert_frequency: alertFrequency })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/alerts");
  revalidatePath("/dashboard/searches");
  return { ok: true };
}

export async function updateProfile(input: unknown): Promise<CustomerActionResult> {
  const user = await getSessionUser();
  if (!user) return UNAUTHORIZED;

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Servicio no disponible." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone ?? null,
      whatsapp: parsed.data.whatsapp ?? null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Perfil actualizado." };
}
