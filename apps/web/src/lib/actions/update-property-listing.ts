"use server";

import { revalidatePath } from "next/cache";
import { AMENITIES_BY_KEY } from "@paradise/config";
import { listPropertySchema } from "@paradise/validation";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser, isAgencyUser, isStaffUser } from "@/lib/auth";
import {
  normalizeListingPayload,
  resolveAgentAgencyId,
  resolveLocationIds,
} from "@/lib/actions/list-property-shared";
import type { ListingResult } from "@/lib/actions/list-property";

interface EditableProperty {
  id: string;
  slug: string;
  code: string;
  status: string;
  agent_id: string | null;
  agency_id: string | null;
  owner_profile_id: string | null;
}

/**
 * Autoriza la edición: dueño (perfil que la publicó), el agente asignado,
 * un admin de la agencia dueña, o staff. Usamos el cliente admin (bypasa RLS)
 * para las escrituras, así que esta verificación es la única barrera real.
 */
async function canEditProperty(propertyId: string) {
  const user = await getSessionUser();
  const admin = getSupabaseAdminClient();
  if (!user || !admin) {
    return { user, admin, property: null as EditableProperty | null, allowed: false };
  }

  const { data: property } = await admin
    .from("properties")
    .select("id, slug, code, status, agent_id, agency_id, owner_profile_id")
    .eq("id", propertyId)
    .maybeSingle();

  if (!property) return { user, admin, property: null, allowed: false };

  const p = property as EditableProperty;
  const allowed =
    isStaffUser(user) ||
    p.owner_profile_id === user.id ||
    (user.agentId != null && p.agent_id === user.agentId) ||
    (isAgencyUser(user) &&
      user.memberships.some((m) => m.organizationType === "agency" && m.organizationId === p.agency_id));

  return { user, admin, property: p, allowed };
}

export async function updatePropertyListing(propertyId: string, raw: any): Promise<ListingResult> {
  const payload = normalizeListingPayload(raw);

  const parsed = listPropertySchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, message: "Revisa los campos marcados.", fieldErrors };
  }

  // Honeypot
  if (raw.website) return { ok: true, code: "PH-XXX-00000" };

  const data = parsed.data;

  if (!isSupabaseConfigured) {
    console.info("[listing:update:demo]", { propertyId, title: data.title });
    return { ok: true, code: "PH-DEMO-00000" };
  }

  const { user, admin, property, allowed } = await canEditProperty(propertyId);
  if (!user) return { ok: false, message: "Debes iniciar sesión para editar." };
  if (!admin) return { ok: false, message: "El servicio no está disponible ahora mismo." };
  if (!property) return { ok: false, message: "La propiedad no existe." };
  if (!allowed) return { ok: false, message: "No tienes permiso para editar esta propiedad." };

  try {
    const locIds = await resolveLocationIds(admin, {
      province: data.provinceSlug,
      city: data.citySlug,
      sector: data.sectorSlug,
    });
    // Autosana `agency_id` a partir del agente asignado (el formulario no
    // permite reasignar agente, así que no tocamos `agent_id` aquí).
    const agencyId = property.agent_id
      ? await resolveAgentAgencyId(admin, property.agent_id)
      : property.agency_id;

    // Un rechazo que se corrige vuelve a la cola de revisión. Cualquier otro
    // estado (borrador, en revisión, publicada) se mantiene: el dueño puede
    // corregir precio/fotos/typos sin perder la publicación en vivo.
    const nextStatus = property.status === "REJECTED" ? "PENDING_REVIEW" : property.status;

    const updatePayload: Record<string, unknown> = {
      title: data.title,
      description: data.description,
      operation_type: data.operationType,
      property_type: data.propertyType,
      condition_status: data.conditionStatus,
      price: data.priceOnRequest ? null : (data.price ?? null),
      price_on_request: data.priceOnRequest,
      currency: data.currency,
      maintenance_fee: data.maintenanceFee ?? null,
      maintenance_fee_currency: data.maintenanceFee ? data.currency : null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      parking_spaces: data.parkingSpaces ?? null,
      construction_m2: data.constructionM2 ?? null,
      land_m2: data.landM2 ?? null,
      year_built: data.yearBuilt ?? null,
      floor: data.floor ?? null,
      total_floors: data.totalFloors ?? null,
      furnished: data.furnished,
      pet_friendly: data.petFriendly,
      airbnb_friendly: data.airbnbFriendly,
      address: data.address ?? null,
      sector_id: locIds.sector,
      city_id: locIds.city,
      province_id: locIds.province,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      hide_exact_location: data.hideExactLocation,
      status: nextStatus,
      moderation_state: nextStatus,
      agency_id: agencyId,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_whatsapp: data.contactWhatsapp || data.contactPhone,
      contact_email: data.contactEmail,
      video_url: data.videoUrl || null,
      virtual_tour_url: data.virtualTourUrl || null,
      // slug y code no se tocan: preserva enlaces existentes / SEO.
    };
    if (property.status === "REJECTED") updatePayload.reject_reason = null;

    const { error } = await admin.from("properties").update(updatePayload).eq("id", propertyId);
    if (error) throw error;

    // Reemplaza imágenes/amenidades/features en bloque (más simple y seguro
    // que diffear contra lo existente).
    await admin.from("property_images").delete().eq("property_id", propertyId);
    if (data.images.length) {
      const { error: imgError } = await admin.from("property_images").insert(
        data.images.map((img, i) => ({
          property_id: propertyId,
          url: img.url,
          storage_path: img.storagePath,
          alt: img.alt ?? null,
          position: i,
          is_cover: img.isCover || i === 0,
        })),
      );
      if (imgError) throw imgError;
    }

    await admin.from("property_amenities").delete().eq("property_id", propertyId);
    await admin.from("property_features").delete().eq("property_id", propertyId);
    if (data.amenityKeys.length) {
      await admin
        .from("property_amenities")
        .insert(data.amenityKeys.map((key) => ({ property_id: propertyId, key })));
      await admin.from("property_features").insert(
        data.amenityKeys.map((key) => ({
          property_id: propertyId,
          key,
          label: AMENITIES_BY_KEY[key]?.label ?? key,
          value: "true",
          group_key: AMENITIES_BY_KEY[key]?.group ?? "edificio",
        })),
      );
    }

    await admin.from("moderation_log").insert({
      entity_type: "property",
      entity_id: propertyId,
      to_state: nextStatus,
      actor_id: user.id,
      reason: "Edición desde el panel",
    });

    revalidatePath(`/property/${property.slug}`);
    revalidatePath("/agent/dashboard/properties");
    revalidatePath("/agency/dashboard/properties");
    revalidatePath("/admin/properties");

    return { ok: true, code: property.code };
  } catch (err) {
    console.error("[updatePropertyListing]", err);
    return { ok: false, message: "No pudimos guardar los cambios. Intenta de nuevo." };
  }
}
