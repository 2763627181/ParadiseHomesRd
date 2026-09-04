"use server";

import { revalidatePath } from "next/cache";
import { toSlug } from "@paradise/utils/slug";

import { env } from "@/lib/env";
import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface AgencyInviteResult {
  ok: boolean;
  message?: string;
}

/** Genera un slug único para `agents`, reintentando con sufijo aleatorio si ya existe. */
async function uniqueAgentSlug(admin: ReturnType<typeof getSupabaseAdminClient>, base: string): Promise<string> {
  const root = toSlug(base) || "asesor";
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin!.from("agents").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/**
 * Invita a un nuevo asesor a la inmobiliaria del usuario actual: crea el usuario en Supabase Auth
 * (correo de invitación para que defina su contraseña), asigna `profiles.role = 'AGENT'`, crea su
 * fila en `agents` y lo vincula en `organization_members` con `status: 'invited'`.
 */
export async function inviteAgentToAgency(input: {
  fullName: string;
  email: string;
  phone?: string;
}): Promise<AgencyInviteResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Inicia sesión con una cuenta de inmobiliaria para invitar asesores." };

  // Solo el dueño/admin de una inmobiliaria (o staff) puede invitar asesores a esa inmobiliaria.
  const membership = user.memberships.find(
    (m) => m.organizationType === "agency" && (m.role === "owner" || m.role === "admin"),
  );
  const allowed = isStaffUser(user) || Boolean(membership);
  const agencyId = membership?.organizationId;
  if (!allowed || !agencyId) {
    return { ok: false, message: "Inicia sesión con una cuenta de inmobiliaria para invitar asesores." };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  if (!fullName) return { ok: false, message: "El nombre es obligatorio." };
  if (!email) return { ok: false, message: "El correo es obligatorio." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const slug = await uniqueAgentSlug(admin, fullName);

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${env.APP_URL}/auth/callback?next=${encodeURIComponent("/agent/dashboard")}`,
  });
  if (inviteError || !data?.user) {
    const message = inviteError?.message ?? "";
    if (
      inviteError?.code === "email_exists" ||
      inviteError?.code === "user_already_exists" ||
      /already/i.test(message)
    ) {
      return { ok: false, message: "Ya existe una cuenta con ese correo." };
    }
    return { ok: false, message: message || "No pudimos enviar la invitación." };
  }
  const invitedId = data.user.id;

  const { error: profileError } = await admin.from("profiles").update({ role: "AGENT" }).eq("id", invitedId);
  if (profileError) {
    return { ok: false, message: `Usuario invitado, pero no se pudo asignar el rol: ${profileError.message}` };
  }

  const { error: agentError } = await admin.from("agents").insert({
    profile_id: invitedId,
    agency_id: agencyId,
    slug,
    full_name: fullName,
    email,
    phone: input.phone?.trim() || null,
  });
  if (agentError) {
    return { ok: false, message: `Usuario invitado, pero no se pudo crear el perfil de asesor: ${agentError.message}` };
  }

  const { error: memberError } = await admin.from("organization_members").insert({
    organization_type: "agency",
    agency_id: agencyId,
    profile_id: invitedId,
    role: "agent",
    status: "invited",
    invited_by: user.id,
  });
  if (memberError) {
    return {
      ok: false,
      message: `Usuario invitado, pero no se pudo vincular a la inmobiliaria: ${memberError.message}`,
    };
  }

  revalidatePath("/agency/dashboard/agents");
  return { ok: true, message: `Invitación enviada a ${email}.` };
}
