import "server-only";

import type {
  Agency,
  Agent,
  Developer,
  Location,
  Project,
  PropertySummary,
} from "@paradise/types";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { viewRowToPropertySummary } from "@/lib/data/mappers";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PROJECT_SELECT = `
  *,
  developer:developers(*),
  sector:locations!projects_sector_id_fkey(name, slug),
  city:locations!projects_city_id_fkey(name, slug),
  province:locations!projects_province_id_fkey(name, slug),
  images:project_images(*),
  buildings:project_buildings(*),
  units:project_units(*),
  payment_plans:payment_plans(*)
`;

function mapDeveloper(row: any): Developer | null {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logo_url,
    coverImageUrl: row.cover_image_url,
    isVerified: row.is_verified,
    projectCount: 0,
    deliveredUnits: 0,
    description: row.description,
    website: row.website,
    phone: row.phone,
    whatsapp: row.whatsapp,
    foundedYear: row.founded_year,
    areas: row.areas ?? [],
  };
}

function mapProject(row: any): Project {
  const units = (row.units ?? [])
    .map((u: any) => ({
      id: u.id,
      code: u.code,
      buildingId: u.building_id,
      buildingName: (row.buildings ?? []).find((b: any) => b.id === u.building_id)?.name ?? null,
      label: u.label,
      level: u.level,
      unitType: u.unit_type,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms == null ? null : Number(u.bathrooms),
      areaM2: u.area_m2 == null ? null : Number(u.area_m2),
      price: u.price == null ? null : Number(u.price),
      currency: u.currency,
      status: u.status,
      floorPlanUrl: u.floor_plan_url,
    }))
    .sort((a: any, b: any) => (a.price ?? 0) - (b.price ?? 0));

  const images = (row.images ?? [])
    .map((i: any) => ({
      id: i.id,
      url: i.url,
      storagePath: i.storage_path,
      alt: i.alt,
      width: i.width,
      height: i.height,
      blurDataUrl: i.blur_data_url,
      position: i.position,
      isCover: i.is_cover,
    }))
    .sort((a: any, b: any) => a.position - b.position);

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    name: row.name,
    status: row.status,
    coverImage: images.find((i: any) => i.isCover) ?? images[0] ?? null,
    location: {
      address: row.address,
      sector: row.sector?.name ?? null,
      sectorSlug: row.sector?.slug ?? null,
      city: row.city?.name ?? null,
      citySlug: row.city?.slug ?? null,
      province: row.province?.name ?? null,
      provinceSlug: row.province?.slug ?? null,
      country: "República Dominicana",
      latitude: row.latitude,
      longitude: row.longitude,
      hideExactLocation: false,
    },
    priceFrom: { amount: row.price_from == null ? null : Number(row.price_from), currency: row.currency, onRequest: false, period: null },
    priceTo: row.price_to == null ? null : { amount: Number(row.price_to), currency: row.currency, onRequest: false, period: null },
    deliveryEstimate: row.delivery_estimate,
    bedroomsRange:
      row.bedrooms_min != null && row.bedrooms_max != null ? [row.bedrooms_min, row.bedrooms_max] : null,
    availableUnits: units.filter((u: any) => u.status === "AVAILABLE").length,
    totalUnits: units.length,
    developer: mapDeveloper(row.developer),
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    description: row.description ?? "",
    images,
    video: row.video_url ? { provider: "youtube", url: row.video_url, title: null } : null,
    masterplanUrl: row.masterplan_url,
    amenityKeys: row.amenity_keys ?? [],
    buildings: (row.buildings ?? [])
      .map((b: any) => ({
        id: b.id,
        name: b.name,
        position: b.position,
        floors: b.floors,
        unitCount: units.filter((u: any) => u.buildingId === b.id).length,
      }))
      .sort((a: any, b: any) => a.position - b.position),
    units,
    paymentPlans: (row.payment_plans ?? []).map((p: any) => ({
      id: p.id,
      name: p.name,
      separationAmount: p.separation_amount == null
        ? null
        : { amount: Number(p.separation_amount), currency: p.separation_currency ?? "USD", onRequest: false, period: null },
      downPaymentPct: Number(p.down_payment_pct),
      duringConstructionPct: Number(p.during_construction_pct),
      onDeliveryPct: Number(p.on_delivery_pct),
      notes: p.notes,
      isDefault: p.is_default,
    })),
    deliveredUnits: 0,
    isDemo: row.is_demo,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAgent(row: any): Agent {
  return {
    id: row.id,
    slug: row.slug,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    title: row.title,
    isVerified: row.is_verified,
    agencyName: row.agency?.name ?? row.agency_name ?? null,
    agencySlug: row.agency?.slug ?? row.agency_slug ?? null,
    whatsapp: row.whatsapp,
    phone: row.phone,
    responseTimeMinutes: row.response_time_minutes,
    languages: row.languages ?? [],
    areas: row.areas ?? [],
    activeListings: row.active_listings ?? 0,
    ratingAverage: row.rating_average == null ? null : Number(row.rating_average),
    ratingCount: row.rating_count ?? 0,
    bio: row.bio,
    email: row.email,
    coverImageUrl: row.cover_image_url,
    yearsExperience: row.years_experience,
    socialLinks: row.social_links ?? {},
    joinedAt: row.created_at,
  };
}

function mapAgency(row: any): Agency {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    logoUrl: row.logo_url,
    isVerified: row.is_verified,
    city: row.city?.name ?? row.city_name ?? null,
    activeListings: row.active_listings ?? 0,
    projectCount: row.project_count ?? 0,
    agentCount: row.agent_count ?? 0,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    website: row.website,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    areas: row.areas ?? [],
    socialLinks: row.social_links ?? {},
    foundedYear: row.founded_year,
    createdAt: row.created_at,
  };
}

// ── Projects ───────────────────────────────────────────────────────────────
export async function sbListProjects(): Promise<Project[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("moderation_state", "PUBLISHED")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) {
    console.error("[sbListProjects]", error.message);
    return null;
  }
  return (data ?? []).map(mapProject);
}

export async function sbGetProjectBySlug(slug: string): Promise<Project | null | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("slug", slug)
    .eq("moderation_state", "PUBLISHED")
    .maybeSingle();
  if (error) {
    console.error("[sbGetProjectBySlug]", error.message);
    return undefined;
  }
  return data ? mapProject(data) : null;
}

// ── Agents ─────────────────────────────────────────────────────────────────
export async function sbListAgents(): Promise<Agent[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("agents")
    .select("*, agency:agencies(name, slug)")
    .order("is_verified", { ascending: false })
    .order("rating_average", { ascending: false, nullsFirst: false });
  if (error) return null;
  return (data ?? []).map(mapAgent);
}

export async function sbGetAgentBySlug(slug: string): Promise<Agent | null | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("agents")
    .select("*, agency:agencies(name, slug)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return undefined;
  return data ? mapAgent(data) : null;
}

// ── Agencies ───────────────────────────────────────────────────────────────
export async function sbListAgencies(): Promise<Agency[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("agencies")
    .select("*, city:locations(name)")
    .order("is_verified", { ascending: false })
    .order("name");
  if (error) return null;
  return (data ?? []).map(mapAgency);
}

export async function sbGetAgencyBySlug(slug: string): Promise<Agency | null | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase
    .from("agencies")
    .select("*, city:locations(name)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) return undefined;
  return data ? mapAgency(data) : null;
}

export async function sbGetDeveloperBySlug(slug: string): Promise<Developer | null | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase.from("developers").select("*").eq("slug", slug).maybeSingle();
  if (error) return undefined;
  return data ? mapDeveloper(data) : null;
}

// ── Property summaries by relation (agente / agencia) ──────────────────────
export async function sbPropertiesBy(
  column: "agent_id" | "agency_id" | "developer_id" | "project_id",
  id: string,
): Promise<PropertySummary[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("property_summaries")
    .select("*")
    .eq("status", "PUBLISHED")
    .eq(column, id)
    .order("published_at", { ascending: false });
  if (error) return null;
  return (data ?? []).map((r: any) => viewRowToPropertySummary(r));
}

// ── Locations ──────────────────────────────────────────────────────────────
function mapLocation(row: any): Location {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    parentId: row.parent_id,
    parentSlug: null,
    latitude: row.latitude,
    longitude: row.longitude,
    isFeatured: row.is_featured,
    blurb: row.blurb,
    imageUrl: row.image_url,
    propertyCount: row.property_count ?? 0,
  };
}

export async function sbGetFeaturedLocations(): Promise<Location[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .eq("is_featured", true)
    .order("property_count", { ascending: false });
  if (error) return null;
  return (data ?? []).map(mapLocation);
}

export async function sbGetLocationBySlug(slug: string): Promise<Location | null | undefined> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return undefined;
  const { data, error } = await supabase.from("locations").select("*").eq("slug", slug).maybeSingle();
  if (error) return undefined;
  return data ? mapLocation(data) : null;
}
