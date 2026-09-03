"use server";

import { headers } from "next/headers";
import { PROPERTY_CODE_PREFIX, PROPERTY_TYPE_LABELS } from "@paradise/config";
import { buildPropertySlug, toSlug } from "@paradise/utils/slug";
import { AMENITIES_BY_KEY } from "@paradise/config";
import { listPropertySchema } from "@paradise/validation";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export interface ListingResult {
  ok: boolean;
  code?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const num = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export async function submitPropertyListing(raw: any): Promise<ListingResult> {
  // Normaliza el payload del wizard (strings) al esquema tipado.
  const payload = {
    operationType: raw.operationType || undefined,
    propertyType: raw.propertyType || undefined,
    conditionStatus: raw.conditionStatus || undefined,
    provinceSlug: raw.provinceSlug || "",
    citySlug: raw.citySlug || "",
    sectorSlug: raw.sectorSlug || undefined,
    address: raw.address || undefined,
    latitude: num(raw.latitude),
    longitude: num(raw.longitude),
    hideExactLocation: Boolean(raw.hideExactLocation),
    title: (raw.title ?? "").trim(),
    description: (raw.description ?? "").trim(),
    bedrooms: num(raw.bedrooms),
    bathrooms: num(raw.bathrooms),
    parkingSpaces: num(raw.parkingSpaces),
    constructionM2: num(raw.constructionM2),
    landM2: num(raw.landM2),
    yearBuilt: num(raw.yearBuilt),
    floor: num(raw.floor),
    totalFloors: num(raw.totalFloors),
    priceOnRequest: Boolean(raw.priceOnRequest),
    price: num(raw.price),
    currency: raw.currency || "USD",
    maintenanceFee: num(raw.maintenanceFee),
    deliveryDate: raw.deliveryDate || undefined,
    amenityKeys: Array.isArray(raw.amenityKeys) ? raw.amenityKeys : [],
    furnished: Boolean(raw.furnished),
    petFriendly: Boolean(raw.petFriendly),
    airbnbFriendly: Boolean(raw.airbnbFriendly),
    images: (raw.images ?? []).map((img: any, i: number) => ({
      storagePath: img.storagePath,
      url: img.url,
      position: i,
      isCover: Boolean(img.isCover),
      alt: img.alt || undefined,
    })),
    videoUrl: raw.videoUrl || "",
    virtualTourUrl: raw.virtualTourUrl || "",
    contactName: (raw.contactName ?? "").trim(),
    contactPhone: raw.contactPhone ?? "",
    contactWhatsapp: raw.contactWhatsapp || "",
    contactEmail: (raw.contactEmail ?? "").trim(),
    acceptTerms: raw.acceptTerms === true,
  };

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
    console.info("[listing:demo]", { title: data.title, type: data.propertyType });
    return { ok: true, code: "PH-DEMO-00000" };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) return { ok: false, message: "El servicio no está disponible ahora mismo." };

  const user = await getSessionUser();
  const hdrs = await headers();

  try {
    const locIds = await resolveLocationIds(admin, {
      province: data.provinceSlug,
      city: data.citySlug,
      sector: data.sectorSlug,
    });

    const prefix = PROPERTY_CODE_PREFIX[data.propertyType];
    const tempSlug = `${toSlug(PROPERTY_TYPE_LABELS[data.propertyType])}-${toSlug(data.citySlug)}-${Date.now().toString(36)}`;

    const { data: inserted, error } = await admin
      .from("properties")
      .insert({
        slug: tempSlug,
        code: "", // el trigger lo genera
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
        status: "PENDING_REVIEW",
        moderation_state: "PENDING_REVIEW",
        owner_profile_id: user?.id ?? null,
        agent_id: user?.agentId ?? null,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        contact_whatsapp: data.contactWhatsapp || data.contactPhone,
        contact_email: data.contactEmail,
        video_url: data.videoUrl || null,
        virtual_tour_url: data.virtualTourUrl || null,
      })
      .select("id, code")
      .single();

    if (error || !inserted) throw error ?? new Error("insert failed");

    const propertyId = inserted.id as string;
    const code = inserted.code as string;

    const finalSlug = buildPropertySlug({
      propertyTypeLabel: PROPERTY_TYPE_LABELS[data.propertyType],
      bedrooms: data.bedrooms ?? null,
      sector: data.sectorSlug ?? data.citySlug,
      code,
    });
    await admin.from("properties").update({ slug: finalSlug }).eq("id", propertyId);

    if (data.images.length) {
      await admin.from("property_images").insert(
        data.images.map((img, i) => ({
          property_id: propertyId,
          url: img.url,
          storage_path: img.storagePath,
          alt: img.alt ?? null,
          position: i,
          is_cover: img.isCover || i === 0,
        })),
      );
    }

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
      to_state: "PENDING_REVIEW",
      actor_id: user?.id ?? null,
      reason: `Publicación desde ${hdrs.get("referer") ?? "web"}`,
    });

    return { ok: true, code };
  } catch (err) {
    console.error("[submitPropertyListing]", err);
    return { ok: false, message: "No pudimos guardar la publicación. Intenta de nuevo." };
  }
}

async function resolveLocationIds(
  admin: any,
  slugs: { province: string; city: string; sector?: string },
) {
  const wanted = [slugs.province, slugs.city, slugs.sector].filter(Boolean) as string[];
  const { data } = await admin.from("locations").select("id, slug").in("slug", wanted);
  const bySlug = new Map<string, string>((data ?? []).map((r: any) => [r.slug, r.id]));
  return {
    province: bySlug.get(slugs.province) ?? null,
    city: bySlug.get(slugs.city) ?? null,
    sector: slugs.sector ? (bySlug.get(slugs.sector) ?? null) : null,
  };
}
