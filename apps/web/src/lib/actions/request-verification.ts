"use server";

import { revalidatePath } from "next/cache";

import { getSessionUser, isAgencyUser } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { notifyStaff } from "@/lib/notify";

export interface RequestVerificationResult {
  ok: boolean;
  message?: string;
}

type Target = "agent" | "agency" | "developer";

/**
 * Un asesor / inmobiliaria / desarrolladora solicita la verificación
 * "Paradise Verified". Crea una fila PENDING en `verification_requests`
 * (idempotente: si ya hay una pendiente, no duplica) y avisa al staff.
 */
export async function requestVerification(
  targetType: Target,
  targetId: string,
): Promise<RequestVerificationResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Inicia sesión." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  // Autorización: el asesor dueño del perfil, o admin de la organización.
  let authorized = false;
  let name = "";
  if (targetType === "agent") {
    const { data } = await admin.from("agents").select("profile_id, full_name, is_verified").eq("id", targetId).maybeSingle();
    authorized = data?.profile_id === user.id;
    name = data?.full_name ?? "";
    if (data?.is_verified) return { ok: false, message: "Ya estás verificado." };
  } else {
    const col = targetType === "agency" ? "agency_id" : "developer_id";
    authorized =
      isAgencyUser(user) &&
      user.memberships.some(
        (m) => m.organizationType === targetType && m.organizationId === targetId && (m.role === "owner" || m.role === "admin"),
      );
    const { data } = await admin.from(`${targetType === "agency" ? "agencies" : "developers"}`).select("name, is_verified").eq("id", targetId).maybeSingle();
    name = data?.name ?? "";
    if (data?.is_verified) return { ok: false, message: "Ya está verificada." };
    void col;
  }
  if (!authorized) return { ok: false, message: "No autorizado." };

  const { data: existing } = await admin
    .from("verification_requests")
    .select("id")
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .eq("status", "PENDING")
    .maybeSingle();
  if (existing) return { ok: true, message: "Ya tienes una solicitud pendiente. El equipo la revisará pronto." };

  const { error } = await admin.from("verification_requests").insert({
    target_type: targetType,
    target_id: targetId,
    status: "PENDING",
    submitted_by: user.id,
  });
  if (error) return { ok: false, message: error.message };

  try {
    await notifyStaff({
      type: "verification_requested",
      title: "Nueva solicitud de verificación",
      body: `${name || targetType} solicitó el sello Paradise Verified`,
      payload: { href: "/admin/verifications" },
    });
  } catch (err) {
    console.error("[requestVerification:notify]", err);
  }

  revalidatePath("/admin/verifications");
  revalidatePath(`/${targetType === "agent" ? "agent" : targetType}/dashboard/settings`);
  return { ok: true, message: "Solicitud enviada. El equipo revisará tu perfil." };
}
