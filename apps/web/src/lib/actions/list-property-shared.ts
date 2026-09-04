/**
 * Helpers compartidos entre `submitPropertyListing` (list-property.ts) y
 * `updatePropertyListing` (update-property-listing.ts). Viven en un módulo
 * SIN `"use server"` a propósito: un archivo `"use server"` solo puede
 * exportar funciones async (regla de Server Actions de Next.js), y
 * `normalizeListingPayload` es síncrona.
 */

const num = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

/** Normaliza el payload del wizard (strings de <input>) al esquema tipado. */
export function normalizeListingPayload(raw: any) {
  return {
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
}

/** Resuelve slugs de ubicación (provincia/municipio/sector) a sus ids en `locations`. */
export async function resolveLocationIds(
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

/**
 * Resuelve la `agency_id` del agente autenticado (si tiene una). Sin esto,
 * `properties.agency_id` queda siempre null y los dashboards de inmobiliaria
 * (que filtran por `agency_id`) nunca ven las propiedades de sus asesores.
 */
export async function resolveAgentAgencyId(admin: any, agentId: string | null | undefined) {
  if (!agentId) return null;
  const { data } = await admin.from("agents").select("agency_id").eq("id", agentId).maybeSingle();
  return (data?.agency_id as string | null | undefined) ?? null;
}
