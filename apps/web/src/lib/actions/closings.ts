"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { CommissionStatus } from "@paradise/config";
import type { SessionUser } from "@paradise/types";
import { formatPrice, type CurrencyCode } from "@paradise/utils/currency";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { notifyStaff } from "@/lib/notify";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface ClosingActionResult {
  ok: boolean;
  message?: string;
}

const registerSchema = z.object({
  leadId: z.string().uuid(),
  closingAmount: z.number().positive("El monto debe ser mayor a 0."),
  currency: z.enum(["USD", "DOP"]),
  closedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida."),
  commissionPercent: z.number().min(0).max(100).optional(),
  commissionAmount: z.number().min(0).optional(),
  partnerName: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(1500).optional(),
});

function isAgencyManagerOf(user: SessionUser, agencyId: string | null): boolean {
  if (!agencyId) return false;
  return user.memberships.some(
    (m) => m.organizationType === "agency" && m.organizationId === agencyId && (m.role === "owner" || m.role === "admin"),
  );
}
function isDeveloperManagerOf(user: SessionUser, developerId: string | null): boolean {
  if (!developerId) return false;
  return user.memberships.some(
    (m) =>
      m.organizationType === "developer" && m.organizationId === developerId && (m.role === "owner" || m.role === "admin"),
  );
}

/** Registra un cierre para un lead y (si aplica) su comisión. */
export async function registerClosing(input: unknown): Promise<ClosingActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Revisa los datos." };
  }
  const data = parsed.data;

  const user = await getSessionUser();
  if (!user) return { ok: false, message: "Inicia sesión." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select(
      "id, property_id, unit_id, agent_id, agency_id, developer_id, status, property:properties(title), agent:agents(full_name), contact:contacts(full_name)",
    )
    .eq("id", data.leadId)
    .maybeSingle();
  if (leadError || !lead) return { ok: false, message: "Lead no encontrado." };

  const l: any = lead;
  const allowed =
    isStaffUser(user) ||
    (user.agentId != null && l.agent_id === user.agentId) ||
    isAgencyManagerOf(user, l.agency_id) ||
    isDeveloperManagerOf(user, l.developer_id);
  if (!allowed) return { ok: false, message: "No autorizado." };

  const { data: closing, error } = await admin
    .from("closings")
    .insert({
      closing_code: "",
      lead_id: l.id,
      property_id: l.property_id ?? null,
      unit_id: l.unit_id ?? null,
      agent_id: l.agent_id ?? null,
      agency_id: l.agency_id ?? null,
      developer_id: l.developer_id ?? null,
      closing_amount: data.closingAmount,
      currency: data.currency,
      partner_name: data.partnerName || null,
      closed_at: data.closedAt,
      notes: data.notes || null,
    })
    .select("id")
    .single();
  if (error || !closing) return { ok: false, message: error?.message ?? "No se pudo registrar el cierre." };

  const commissionAmount =
    data.commissionAmount ?? Math.round((data.closingAmount * (data.commissionPercent ?? 0)) / 100 * 100) / 100;
  if (commissionAmount > 0) {
    await admin.from("commissions").insert({
      commission_code: "",
      closing_id: closing.id,
      amount: commissionAmount,
      currency: data.currency,
      status: "PENDING",
    });
  }

  if (l.status !== "CLOSED_WON") {
    await admin.from("leads").update({ status: "CLOSED_WON", closed_at: new Date().toISOString() }).eq("id", l.id);
  }

  const money = formatPrice(data.closingAmount, data.currency as CurrencyCode, { compact: true });
  try {
    await admin.from("lead_activities").insert({
      lead_id: l.id,
      type: "closing_registered",
      title: `Cierre registrado: ${money}`,
      body: data.notes || null,
      actor_id: user.id,
      actor_name: user.fullName,
      metadata: { closingId: closing.id },
    });
    await notifyStaff({
      type: "closing_registered",
      title: `Nuevo cierre: ${money}`,
      body: [l.contact?.full_name, l.property?.title, l.agent?.full_name].filter(Boolean).join(" · "),
      payload: { closingId: closing.id, href: "/admin/closings" },
    });
  } catch (err) {
    console.error("[registerClosing:notify]", err);
  }

  revalidatePath("/agent/dashboard/closings");
  revalidatePath("/agency/dashboard/closings");
  revalidatePath("/developer/dashboard/closings");
  revalidatePath("/admin/closings");
  revalidatePath(`/agent/dashboard/leads/${l.id}`);
  return { ok: true, message: "Cierre registrado." };
}

const COMMISSION_STATUSES: CommissionStatus[] = ["PENDING", "INVOICED", "PAID", "DISPUTED", "CANCELLED"];

/** Solo staff: cambia el estado de una comisión y marca fechas de facturación/pago. */
export async function updateCommissionStatus(
  commissionId: string,
  status: CommissionStatus,
  notes?: string,
): Promise<ClosingActionResult> {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return { ok: false, message: "No autorizado." };
  if (!COMMISSION_STATUSES.includes(status)) return { ok: false, message: "Estado no válido." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const patch: Record<string, unknown> = { status };
  const now = new Date().toISOString();
  if (status === "INVOICED") patch.invoiced_at = now;
  if (status === "PAID") patch.paid_at = now;
  if (notes !== undefined) patch.notes = notes.trim() || null;

  const { error } = await admin.from("commissions").update(patch).eq("id", commissionId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/closings");
  return { ok: true };
}

/** Solo staff: borra un cierre (y su comisión por cascada). Para corregir errores de carga. */
export async function deleteClosing(closingId: string): Promise<ClosingActionResult> {
  const user = await getSessionUser();
  if (!isStaffUser(user)) return { ok: false, message: "No autorizado." };

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { error } = await admin.from("closings").delete().eq("id", closingId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/admin/closings");
  return { ok: true };
}
