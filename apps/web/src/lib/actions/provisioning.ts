"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionUser } from "@paradise/types";
import { toSlug } from "@paradise/utils/slug";

import { env } from "@/lib/env";
import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface ProvisioningResult {
  ok: boolean;
  message?: string;
}

interface PartnerApplicationDbRow {
  id: string;
  company_name: string;
  partner_type: string;
  contact_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  inventory_size: string | null;
  locations: string[];
  message: string | null;
  status: string;
  created_at: string;
}

/** Genera un slug único para `agencies` / `developers` / `agents`, reintentando con sufijo aleatorio. */
async function uniqueSlug(
  admin: SupabaseClient,
  table: "agencies" | "developers" | "agents",
  base: string,
): Promise<string> {
  const root = toSlug(base) || "socio";
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin.from(table).select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

/** Invita un usuario por correo vía Supabase Auth Admin API. El trigger `handle_new_user` crea su `profiles` (role USER). */
async function inviteUser(
  admin: SupabaseClient,
  input: { email: string; fullName: string; redirectPath: string },
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: { full_name: input.fullName },
    redirectTo: `${env.APP_URL}/auth/callback?next=${encodeURIComponent(input.redirectPath)}`,
  });

  if (error || !data?.user) {
    const message = error?.message ?? "";
    if (error?.code === "email_exists" || error?.code === "user_already_exists" || /already/i.test(message)) {
      return { error: "Ya existe una cuenta con ese correo." };
    }
    return { error: message || "No pudimos enviar la invitación." };
  }

  return { id: data.user.id };
}

/** Crea `agencies`/`developers` + invita al usuario dueño + `organization_members` (owner, invited). */
async function provisionOrgAdmin(
  admin: SupabaseClient,
  staff: SessionUser,
  application: PartnerApplicationDbRow,
  orgType: "agency" | "developer",
): Promise<ProvisioningResult> {
  const table = orgType === "agency" ? "agencies" : "developers";
  const slug = await uniqueSlug(admin, table, application.company_name);

  const orgPayload: Record<string, unknown> = {
    slug,
    name: application.company_name,
    phone: application.phone || null,
    whatsapp: application.whatsapp || null,
    website: application.website || null,
    areas: application.locations ?? [],
  };
  if (orgType === "agency") orgPayload.email = application.email || null;

  const { data: org, error: orgError } = await admin.from(table).insert(orgPayload).select("id").single();
  if (orgError || !org) {
    return { ok: false, message: orgError?.message ?? "No se pudo crear la organización." };
  }

  // No existe todavía un dashboard dedicado para desarrolladoras (solo el de
  // inmobiliaria está construido) — se manda a /dashboard para no aterrizar
  // en una ruta inexistente hasta que se construya uno específico.
  const redirectPath = orgType === "agency" ? "/agency/dashboard" : "/dashboard";
  const invited = await inviteUser(admin, {
    email: application.email,
    fullName: application.contact_name,
    redirectPath,
  });
  if ("error" in invited) {
    return {
      ok: false,
      message: `Se creó ${orgType === "agency" ? "la inmobiliaria" : "la desarrolladora"}, pero no se pudo invitar al usuario: ${invited.error}`,
    };
  }

  const role = orgType === "agency" ? "AGENCY_ADMIN" : "DEVELOPER_ADMIN";
  const { error: profileError } = await admin.from("profiles").update({ role }).eq("id", invited.id);
  if (profileError) {
    return { ok: false, message: `Usuario invitado, pero no se pudo asignar el rol: ${profileError.message}` };
  }

  const memberPayload: Record<string, unknown> = {
    organization_type: orgType,
    profile_id: invited.id,
    role: "owner",
    status: "invited",
    invited_by: staff.id,
  };
  if (orgType === "agency") memberPayload.agency_id = org.id;
  else memberPayload.developer_id = org.id;

  const { error: memberError } = await admin.from("organization_members").insert(memberPayload);
  if (memberError) {
    return {
      ok: false,
      message: `Usuario invitado, pero no se pudo vincular a la organización: ${memberError.message}`,
    };
  }

  const { error: statusError } = await admin
    .from("partner_applications")
    .update({ status: "approved" })
    .eq("id", application.id);
  if (statusError) {
    return {
      ok: false,
      message: `Cuenta creada, pero no se pudo actualizar el estado de la solicitud: ${statusError.message}`,
    };
  }

  revalidatePath("/admin/partners");
  return { ok: true, message: `Cuenta creada. Enviamos una invitación a ${application.email}.` };
}

/** Crea un `agents` sin agencia (solo, sin `organization_members`) + invita al usuario. */
async function provisionBroker(
  admin: SupabaseClient,
  application: PartnerApplicationDbRow,
): Promise<ProvisioningResult> {
  const slug = await uniqueSlug(admin, "agents", application.contact_name);

  const invited = await inviteUser(admin, {
    email: application.email,
    fullName: application.contact_name,
    redirectPath: "/agent/dashboard",
  });
  if ("error" in invited) {
    return { ok: false, message: `No se pudo invitar al usuario: ${invited.error}` };
  }

  const { error: profileError } = await admin.from("profiles").update({ role: "AGENT" }).eq("id", invited.id);
  if (profileError) {
    return { ok: false, message: `Usuario invitado, pero no se pudo asignar el rol: ${profileError.message}` };
  }

  const { error: agentError } = await admin.from("agents").insert({
    profile_id: invited.id,
    agency_id: null,
    slug,
    full_name: application.contact_name,
    email: application.email,
    phone: application.phone || null,
    whatsapp: application.whatsapp || null,
  });
  if (agentError) {
    return {
      ok: false,
      message: `Usuario invitado, pero no se pudo crear el perfil de asesor: ${agentError.message}`,
    };
  }

  const { error: statusError } = await admin
    .from("partner_applications")
    .update({ status: "approved" })
    .eq("id", application.id);
  if (statusError) {
    return {
      ok: false,
      message: `Cuenta creada, pero no se pudo actualizar el estado de la solicitud: ${statusError.message}`,
    };
  }

  revalidatePath("/admin/partners");
  return { ok: true, message: `Cuenta creada. Enviamos una invitación a ${application.email}.` };
}

/**
 * Aprueba una solicitud de `/partners/apply` y crea la cuenta correspondiente:
 * inmobiliaria/constructora → `agencies` + AGENCY_ADMIN; desarrolladora → `developers` + DEVELOPER_ADMIN;
 * broker → `agents` sin agencia + AGENT. Los propietarios ('owner') no requieren cuenta especial.
 */
export async function approvePartnerApplication(applicationId: string): Promise<ProvisioningResult> {
  const staff = await getSessionUser();
  if (!isStaffUser(staff)) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: application, error: appError } = await admin
    .from("partner_applications")
    .select(
      "id, company_name, partner_type, contact_name, email, phone, whatsapp, website, instagram, inventory_size, locations, message, status, created_at",
    )
    .eq("id", applicationId)
    .maybeSingle();
  if (appError || !application) return { ok: false, message: "Solicitud no encontrada." };

  const row = application as PartnerApplicationDbRow;

  if (row.partner_type === "owner") {
    const { error } = await admin
      .from("partner_applications")
      .update({ status: "contacted" })
      .eq("id", applicationId);
    if (error) return { ok: false, message: error.message };

    revalidatePath("/admin/partners");
    return {
      ok: true,
      message:
        "Los propietarios no necesitan cuenta especial — indícale que se registre y publique desde /list-property.",
    };
  }

  if (row.partner_type === "agency" || row.partner_type === "construction") {
    return provisionOrgAdmin(admin, staff!, row, "agency");
  }
  if (row.partner_type === "developer") {
    return provisionOrgAdmin(admin, staff!, row, "developer");
  }
  if (row.partner_type === "broker") {
    return provisionBroker(admin, row);
  }

  return { ok: false, message: `Tipo de socio no soportado: ${row.partner_type}` };
}

/** Rechaza una solicitud de `/partners/apply` (no crea ninguna cuenta). */
export async function rejectPartnerApplication(
  applicationId: string,
  reason?: string,
): Promise<ProvisioningResult> {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  if (reason) console.info("[rejectPartnerApplication]", applicationId, reason);

  const { error } = await admin
    .from("partner_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/partners");
  return { ok: true };
}
