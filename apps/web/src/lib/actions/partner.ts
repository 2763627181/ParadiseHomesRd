"use server";

import { cookies } from "next/headers";
import { ATTRIBUTION_COOKIE, parseAttribution } from "@paradise/utils/attribution";
import { partnerApplicationSchema } from "@paradise/validation";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export interface PartnerActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitPartnerApplication(input: unknown): Promise<PartnerActionResult> {
  const parsed = partnerApplicationSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Revisa el formulario", fieldErrors };
  }
  const data = parsed.data;
  if (data.website_hp) return { ok: true };

  const cookieStore = await cookies();
  const attribution = parseAttribution(cookieStore.get(ATTRIBUTION_COOKIE)?.value ?? null);

  if (!isSupabaseConfigured) {
    console.info("[partner:demo]", { company: data.companyName, type: data.partnerType, email: data.email });
    return { ok: true };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "Servicio no disponible." };

  const { error } = await admin.from("partner_applications").insert({
    company_name: data.companyName,
    partner_type: data.partnerType,
    contact_name: data.contactName,
    email: data.email,
    phone: data.phone,
    whatsapp: data.whatsapp ?? null,
    website: data.website ?? null,
    instagram: data.instagram ?? null,
    inventory_size: data.inventorySize,
    locations: data.locations,
    message: data.message ?? null,
    utm: attribution?.lastTouch ?? {},
  });

  if (error) {
    console.error("[partner] error", error);
    return { ok: false, message: "No pudimos enviar tu solicitud. Escríbenos por WhatsApp." };
  }
  return { ok: true };
}
