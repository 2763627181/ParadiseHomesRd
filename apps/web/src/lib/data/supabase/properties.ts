import "server-only";

import { getLocationPath } from "@paradise/config";
import type { Property, PropertySummary } from "@paradise/types";
import type { ParsedPropertySearchParams } from "@paradise/validation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rowToImageAsset, viewRowToPropertySummary } from "@/lib/data/mappers";
import type { PropertySearchResponse } from "@/lib/data/properties";

/**
 * Consultas reales a Supabase para propiedades. Se usan cuando el backend está
 * configurado; si no, la capa `data/properties.ts` cae al `demo-store`.
 * El filtrado se hace sobre la vista `property_summaries` (respeta RLS).
 */

const SUMMARY_COLUMNS = "*";
const USD_PER_DOP = 1 / 59;

function toUsd(amount: number, currency: "USD" | "DOP"): number {
  return currency === "USD" ? amount : Math.round(amount * USD_PER_DOP);
}

/** Expande slugs de ubicación a sus descendientes (para filtrar por provincia/ciudad). */
function expandLocationSlugs(slugs: string[]): string[] {
  const out = new Set<string>();
  for (const slug of slugs) {
    out.add(slug);
    for (const node of getLocationPath(slug)) out.add(node.slug);
  }
  return [...out];
}

export async function sbSearchProperties(
  params: ParsedPropertySearchParams,
): Promise<PropertySearchResponse | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  let q = supabase
    .from("property_summaries")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "PUBLISHED");

  if (params.operationType) q = q.eq("operation_type", params.operationType);
  if (params.propertyTypes.length) q = q.in("property_type", params.propertyTypes);
  if (params.conditionStatus.length) q = q.in("condition_status", params.conditionStatus);
  if (params.minBedrooms) q = q.gte("bedrooms", params.minBedrooms);
  if (params.minBathrooms) q = q.gte("bathrooms", params.minBathrooms);
  if (params.minParking) q = q.gte("parking_spaces", params.minParking);
  if (params.minAreaM2) q = q.gte("construction_m2", params.minAreaM2);
  if (params.maxAreaM2) q = q.lte("construction_m2", params.maxAreaM2);
  if (params.verifiedOnly) q = q.eq("is_verified", true);
  if (params.withProjectOnly) q = q.not("project_id", "is", null);

  if (params.locations.length) {
    const slugs = expandLocationSlugs(params.locations);
    const or = slugs
      .flatMap((s) => [`sector_slug.eq.${s}`, `city_slug.eq.${s}`, `province_slug.eq.${s}`])
      .join(",");
    q = q.or(or);
  }

  if (params.q) {
    q = q.textSearch("search_vector", params.q, { type: "websearch", config: "es_unaccent" });
  }

  // Precio: la vista guarda el precio en su moneda; para filtros multi-moneda
  // aproximamos en el cliente. Aquí filtramos en la misma moneda si se indica.
  if (params.currency && (params.minPrice != null || params.maxPrice != null)) {
    q = q.eq("currency", params.currency);
    if (params.minPrice != null) q = q.gte("price", params.minPrice);
    if (params.maxPrice != null) q = q.lte("price", params.maxPrice);
  }

  if (
    params.north != null &&
    params.south != null &&
    params.east != null &&
    params.west != null
  ) {
    q = q
      .gte("latitude", params.south)
      .lte("latitude", params.north)
      .gte("longitude", params.west)
      .lte("longitude", params.east);
  }

  switch (params.sort) {
    case "recent":
      q = q.order("published_at", { ascending: false, nullsFirst: false });
      break;
    case "price_asc":
      q = q.order("price", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false, nullsFirst: false });
      break;
    case "area_desc":
      q = q.order("construction_m2", { ascending: false, nullsFirst: false });
      break;
    default:
      q = q.order("is_featured", { ascending: false }).order("published_at", { ascending: false });
  }

  const offset = params.cursor ? Number(params.cursor) || 0 : 0;
  const limit = params.limit ?? 24;
  q = q.range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    console.error("[sbSearchProperties]", error.message);
    return null;
  }

  const rows = (data ?? []) as Parameters<typeof viewRowToPropertySummary>[0][];
  let items = rows.map(viewRowToPropertySummary);

  // Filtro de amenidades y precio cross-moneda no cubierto por SQL: post-filtro.
  if (params.amenities.length) {
    const ids = items.map((i) => i.id);
    const { data: amenityRows } = await supabase
      .from("property_amenities")
      .select("property_id, key")
      .in("property_id", ids);
    const byProperty = new Map<string, Set<string>>();
    for (const row of (amenityRows ?? []) as { property_id: string; key: string }[]) {
      const set = byProperty.get(row.property_id) ?? new Set();
      set.add(row.key);
      byProperty.set(row.property_id, set);
    }
    items = items.filter((i) =>
      params.amenities.every((a) => byProperty.get(i.id)?.has(a)),
    );
  }

  const total = count ?? items.length;
  const nextCursor = offset + limit < total ? String(offset + limit) : null;

  return {
    items,
    total,
    nextCursor,
    mapPoints: items
      .filter((i) => i.location.latitude != null && i.location.longitude != null)
      .map((i) => ({
        id: i.id,
        slug: i.slug,
        latitude: i.location.latitude!,
        longitude: i.location.longitude!,
        price: i.price.amount,
        currency: i.price.currency,
      })),
  };
}

export async function sbSimilarProperties(
  property: Property,
  limit: number,
): Promise<PropertySummary[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  let q = supabase
    .from("property_summaries")
    .select(SUMMARY_COLUMNS)
    .eq("status", "PUBLISHED")
    .eq("operation_type", property.operationType)
    .neq("id", property.id)
    .limit(limit + 4);

  if (property.location.citySlug) {
    q = q.or(
      `city_slug.eq.${property.location.citySlug},property_type.eq.${property.propertyType}`,
    );
  } else {
    q = q.eq("property_type", property.propertyType);
  }

  const { data, error } = await q;
  if (error) return null;

  const rows = ((data ?? []) as Parameters<typeof viewRowToPropertySummary>[0][]).map(
    viewRowToPropertySummary,
  );
  // Prioriza mismo sector, luego mismo tipo.
  rows.sort((a, b) => {
    const score = (p: PropertySummary) =>
      (p.location.sectorSlug === property.location.sectorSlug ? 2 : 0) +
      (p.propertyType === property.propertyType ? 1 : 0);
    return score(b) - score(a);
  });
  return rows.slice(0, limit);
}

export async function sbGetFeaturedProperties(limit: number): Promise<PropertySummary[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("property_summaries")
    .select(SUMMARY_COLUMNS)
    .eq("status", "PUBLISHED")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return null;
  return ((data ?? []) as Parameters<typeof viewRowToPropertySummary>[0][]).map(
    viewRowToPropertySummary,
  );
}

export async function sbAllPublishedSlugs(): Promise<string[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("properties")
    .select("slug")
    .eq("status", "PUBLISHED")
    .order("published_at", { ascending: false })
    .limit(2000);
  if (error) return null;
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function sbGetPropertyBySlug(slug: string): Promise<Property | null | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return undefined; // undefined => "no backend, usa demo"

  const { data: p, error } = await supabase
    .from("properties")
    .select(
      `*,
       agency:agencies(id, slug, name, logo_url, cover_image_url, description, website, phone, whatsapp, email, is_verified, areas),
       agent:agents(id, slug, full_name, title, bio, avatar_url, email, phone, whatsapp, languages, areas, response_time_minutes, rating_average, rating_count, is_verified, agency_id),
       project:projects(id, slug, name, developer:developers(name)),
       sector:locations!properties_sector_id_fkey(name, slug),
       city:locations!properties_city_id_fkey(name, slug),
       province:locations!properties_province_id_fkey(name, slug),
       images:property_images(*),
       amenities:property_amenities(key),
       features:property_features(key, label, value, group_key),
       price_history:property_price_history(price, currency, changed_at)`,
    )
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (error || !p) return null;

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const row = p as any;
  const images = (row.images ?? [])
    .map(rowToImageAsset)
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position);

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    operationType: row.operation_type,
    propertyType: row.property_type,
    conditionStatus: row.condition_status,
    price: {
      amount: row.price_on_request ? null : row.price,
      currency: row.currency,
      onRequest: row.price_on_request,
      period: row.operation_type === "RENT" ? "month" : null,
    },
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingSpaces: row.parking_spaces,
    constructionM2: row.construction_m2,
    landM2: row.land_m2,
    coverImage: images.find((i: { isCover: boolean }) => i.isCover) ?? images[0] ?? null,
    imageCount: images.length,
    images,
    video: row.video_url ? { provider: "youtube", url: row.video_url, title: null } : null,
    virtualTourUrl: row.virtual_tour_url,
    status: row.status,
    location: {
      address: row.address,
      sector: row.sector?.name ?? null,
      sectorSlug: row.sector?.slug ?? null,
      city: row.city?.name ?? null,
      citySlug: row.city?.slug ?? null,
      province: row.province?.name ?? null,
      provinceSlug: row.province?.slug ?? null,
      country: row.country ?? "República Dominicana",
      latitude: row.latitude,
      longitude: row.longitude,
      hideExactLocation: row.hide_exact_location,
    },
    features: (row.features ?? []).map((f: any) => ({
      key: f.key,
      label: f.label,
      value: f.value,
      group: f.group_key,
    })),
    amenityKeys: (row.amenities ?? []).map((a: any) => a.key),
    maintenanceFee: row.maintenance_fee
      ? { amount: row.maintenance_fee, currency: row.maintenance_fee_currency ?? "USD", period: "month" }
      : null,
    yearBuilt: row.year_built,
    floor: row.floor,
    totalFloors: row.total_floors,
    furnished: row.furnished,
    petFriendly: row.pet_friendly,
    airbnbFriendly: row.airbnb_friendly,
    deliveryDate: null,
    project: row.project
      ? {
          id: row.project.id,
          slug: row.project.slug,
          name: row.project.name,
          developerName: row.project.developer?.name ?? null,
        }
      : null,
    projectId: row.project_id,
    agent: row.agent
      ? {
          id: row.agent.id,
          slug: row.agent.slug,
          fullName: row.agent.full_name,
          avatarUrl: row.agent.avatar_url,
          title: row.agent.title,
          isVerified: row.agent.is_verified,
          agencyName: row.agency?.name ?? null,
          agencySlug: row.agency?.slug ?? null,
          whatsapp: row.agent.whatsapp,
          phone: row.agent.phone,
          responseTimeMinutes: row.agent.response_time_minutes,
          languages: row.agent.languages ?? [],
          areas: row.agent.areas ?? [],
          activeListings: 0,
          ratingAverage: row.agent.rating_average,
          ratingCount: row.agent.rating_count ?? 0,
        }
      : null,
    agency: row.agency
      ? {
          id: row.agency.id,
          slug: row.agency.slug,
          name: row.agency.name,
          logoUrl: row.agency.logo_url,
          isVerified: row.agency.is_verified,
          city: null,
          activeListings: 0,
          projectCount: 0,
          agentCount: 0,
        }
      : null,
    priceHistory: (row.price_history ?? []).map((h: any) => ({
      price: h.price,
      currency: h.currency,
      changedAt: h.changed_at,
    })),
    isDemo: row.is_demo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewCount: row.view_count ?? 0,
    favoriteCount: row.favorite_count ?? 0,
    isFeatured: row.is_featured,
    isVerified: row.is_verified,
    isNew: false,
    publishedAt: row.published_at,
    lastVerifiedAt: row.last_verified_at,
  } satisfies Property;
}
