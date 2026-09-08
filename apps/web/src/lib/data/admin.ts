import "server-only";

import type { PropertyStatus } from "@paradise/config";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Ids de entidades con una solicitud de verificación PENDING (opcionalmente de un solo tipo). */
export async function getPendingVerificationTargetIds(
  targetType?: "agent" | "agency" | "developer" | "property",
): Promise<Set<string>> {
  const admin = getSupabaseAdminClient();
  if (!admin) return new Set();
  let q = admin.from("verification_requests").select("target_id, target_type").eq("status", "PENDING");
  if (targetType) q = q.eq("target_type", targetType);
  const { data, error } = await q.limit(1000);
  if (error) {
    console.error("[getPendingVerificationTargetIds]", error.message);
    return new Set();
  }
  return new Set((data ?? []).map((r: any) => r.target_id as string));
}

export interface AdminPropertyRow {
  id: string;
  code: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  operationType: string;
  propertyType: string;
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  cityName: string | null;
  sectorName: string | null;
  agentName: string | null;
  agencyName: string | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  imageCount: number;
  coverUrl: string | null;
  isVerified: boolean;
  isDemo: boolean;
  rejectReason: string | null;
  createdAt: string;
}

export async function getAdminProperties(
  status?: PropertyStatus | "ALL",
): Promise<{ rows: AdminPropertyRow[]; counts: Record<string, number> } | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: statusRows } = await admin.from("properties").select("status");
  const counts: Record<string, number> = { ALL: 0 };
  for (const r of (statusRows ?? []) as { status: string }[]) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    counts.ALL = (counts.ALL ?? 0) + 1;
  }

  let q = admin
    .from("properties")
    .select(
      `id, code, slug, title, status, operation_type, property_type, price, currency,
       price_on_request, contact_name, contact_phone, contact_email, is_verified, is_demo,
       reject_reason, created_at,
       city:locations!properties_city_id_fkey(name),
       sector:locations!properties_sector_id_fkey(name),
       agent:agents(full_name),
       agency:agencies(name),
       images:property_images(url, is_cover, position)`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (status && status !== "ALL") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    console.error("[getAdminProperties]", error.message);
    return null;
  }

  const rows: AdminPropertyRow[] = (data ?? []).map((p: any) => {
    const images = (p.images ?? []).sort(
      (a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position,
    );
    return {
      id: p.id,
      code: p.code,
      slug: p.slug,
      title: p.title,
      status: p.status,
      operationType: p.operation_type,
      propertyType: p.property_type,
      price: p.price == null ? null : Number(p.price),
      currency: p.currency,
      priceOnRequest: p.price_on_request,
      cityName: p.city?.name ?? null,
      sectorName: p.sector?.name ?? null,
      agentName: p.agent?.full_name ?? null,
      agencyName: p.agency?.name ?? null,
      contactName: p.contact_name,
      contactPhone: p.contact_phone,
      contactEmail: p.contact_email,
      imageCount: images.length,
      coverUrl: images[0]?.url ?? null,
      isVerified: p.is_verified,
      isDemo: p.is_demo,
      rejectReason: p.reject_reason,
      createdAt: p.created_at,
    };
  });

  return { rows, counts };
}

// ── Agencias ─────────────────────────────────────────────────────────────
export interface AdminAgencyRow {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  cityName: string | null;
  agentCount: number;
  isVerified: boolean;
  isDemo: boolean;
  createdAt: string;
}

/** Lista de inmobiliarias con métricas (usa la vista `agency_directory`). */
export async function getAdminAgencies(): Promise<AdminAgencyRow[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("agency_directory")
    .select("id, slug, name, logo_url, city_name, agent_count, is_verified, is_demo, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[getAdminAgencies]", error.message);
    return null;
  }

  return (data ?? []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    logoUrl: a.logo_url,
    cityName: a.city_name,
    agentCount: a.agent_count ?? 0,
    isVerified: a.is_verified,
    isDemo: a.is_demo,
    createdAt: a.created_at,
  }));
}

// ── Agentes ──────────────────────────────────────────────────────────────
export interface AdminAgentRow {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  agencyName: string | null;
  isVerified: boolean;
  ratingAverage: number | null;
  ratingCount: number;
  isDemo: boolean;
  createdAt: string;
}

/** Lista de agentes con su inmobiliaria (usa la vista `agent_directory`). */
export async function getAdminAgents(): Promise<AdminAgentRow[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("agent_directory")
    .select(
      "id, slug, full_name, avatar_url, agency_name, is_verified, rating_average, rating_count, is_demo, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[getAdminAgents]", error.message);
    return null;
  }

  return (data ?? []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.full_name,
    avatarUrl: a.avatar_url,
    agencyName: a.agency_name,
    isVerified: a.is_verified,
    ratingAverage: a.rating_average == null ? null : Number(a.rating_average),
    ratingCount: a.rating_count ?? 0,
    isDemo: a.is_demo,
    createdAt: a.created_at,
  }));
}

// ── Desarrolladoras ──────────────────────────────────────────────────────
export interface AdminDeveloperRow {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  projectCount: number;
  isVerified: boolean;
  isDemo: boolean;
  createdAt: string;
}

export async function getAdminDevelopers(): Promise<AdminDeveloperRow[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("developers")
    .select("id, slug, name, logo_url, is_verified, is_demo, created_at, projects:projects(id)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[getAdminDevelopers]", error.message);
    return null;
  }

  return (data ?? []).map((d: any) => ({
    id: d.id,
    slug: d.slug,
    name: d.name,
    logoUrl: d.logo_url,
    projectCount: (d.projects ?? []).length,
    isVerified: d.is_verified,
    isDemo: d.is_demo,
    createdAt: d.created_at,
  }));
}

// ── Proyectos ────────────────────────────────────────────────────────────
export interface AdminProjectRow {
  id: string;
  code: string;
  slug: string;
  name: string;
  status: string;
  moderationState: string;
  developerName: string | null;
  unitCount: number;
  isVerified: boolean;
  isDemo: boolean;
  createdAt: string;
}

export async function getAdminProjects(): Promise<AdminProjectRow[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("projects")
    .select(
      `id, code, slug, name, status, moderation_state, is_verified, is_demo, created_at,
       developer:developers(name),
       units:project_units(id)`,
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[getAdminProjects]", error.message);
    return null;
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    code: p.code,
    slug: p.slug,
    name: p.name,
    status: p.status,
    moderationState: p.moderation_state,
    developerName: p.developer?.name ?? null,
    unitCount: (p.units ?? []).length,
    isVerified: p.is_verified,
    isDemo: p.is_demo,
    createdAt: p.created_at,
  }));
}

// ── Usuarios ─────────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
  isDemo: boolean;
  createdAt: string;
}

/**
 * Lista de perfiles de la plataforma. RLS limita `profiles` al propio usuario,
 * así que esta lectura usa el cliente con service role (solo lectura, página
 * exclusiva de staff).
 */
export async function getAdminUsers(): Promise<AdminUserRow[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("id, full_name, email, role, is_demo, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    console.error("[getAdminUsers]", error.message);
    return null;
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name,
    email: p.email,
    role: p.role,
    isDemo: p.is_demo,
    createdAt: p.created_at,
  }));
}

// ── Verificaciones (Paradise Verified) ──────────────────────────────────────

export interface AdminVerificationPropertyRow {
  id: string;
  code: string;
  slug: string;
  title: string;
  propertyType: string;
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  cityName: string | null;
  sectorName: string | null;
  agentName: string | null;
  agencyName: string | null;
  coverUrl: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface AdminVerificationAgentRow {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  agencyName: string | null;
  phone: string | null;
  email: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface AdminVerificationAgencyRow {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  cityName: string | null;
  phone: string | null;
  email: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface AdminVerificationsData {
  properties: AdminVerificationPropertyRow[];
  agents: AdminVerificationAgentRow[];
  agencies: AdminVerificationAgencyRow[];
}

export async function getAdminVerifications(): Promise<AdminVerificationsData | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const [propertiesRes, agentsRes, agenciesRes] = await Promise.all([
    admin
      .from("properties")
      .select(
        `id, code, slug, title, property_type, price, currency, price_on_request, is_demo, created_at,
         city:locations!properties_city_id_fkey(name),
         sector:locations!properties_sector_id_fkey(name),
         agent:agents(full_name),
         agency:agencies(name),
         images:property_images(url, is_cover, position)`,
      )
      .eq("is_verified", false)
      .eq("status", "PUBLISHED")
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("agents")
      .select(`id, slug, full_name, avatar_url, phone, email, is_demo, created_at, agency:agencies(name)`)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("agencies")
      .select(`id, slug, name, logo_url, phone, email, is_demo, created_at, city:locations(name)`)
      .eq("is_verified", false)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  if (propertiesRes.error) console.error("[getAdminVerifications:properties]", propertiesRes.error.message);
  if (agentsRes.error) console.error("[getAdminVerifications:agents]", agentsRes.error.message);
  if (agenciesRes.error) console.error("[getAdminVerifications:agencies]", agenciesRes.error.message);

  const properties: AdminVerificationPropertyRow[] = (propertiesRes.data ?? []).map((p: any) => {
    const images = (p.images ?? []).sort(
      (a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position,
    );
    return {
      id: p.id,
      code: p.code,
      slug: p.slug,
      title: p.title,
      propertyType: p.property_type,
      price: p.price == null ? null : Number(p.price),
      currency: p.currency,
      priceOnRequest: p.price_on_request,
      cityName: p.city?.name ?? null,
      sectorName: p.sector?.name ?? null,
      agentName: p.agent?.full_name ?? null,
      agencyName: p.agency?.name ?? null,
      coverUrl: images[0]?.url ?? null,
      isDemo: p.is_demo,
      createdAt: p.created_at,
    };
  });

  const agents: AdminVerificationAgentRow[] = (agentsRes.data ?? []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.full_name,
    avatarUrl: a.avatar_url,
    agencyName: a.agency?.name ?? null,
    phone: a.phone,
    email: a.email,
    isDemo: a.is_demo,
    createdAt: a.created_at,
  }));

  const agencies: AdminVerificationAgencyRow[] = (agenciesRes.data ?? []).map((a: any) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    logoUrl: a.logo_url,
    cityName: a.city?.name ?? null,
    phone: a.phone,
    email: a.email,
    isDemo: a.is_demo,
    createdAt: a.created_at,
  }));

  return { properties, agents, agencies };
}

// ── Solicitudes de socios (/partners/apply) ─────────────────────────────────

export interface PartnerApplicationRow {
  id: string;
  companyName: string;
  partnerType: string;
  contactName: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  inventorySize: string | null;
  locations: string[];
  message: string | null;
  status: string;
  createdAt: string;
}

/** Lista de solicitudes de `/partners/apply`, más recientes primero. */
export async function getPartnerApplications(status?: string): Promise<PartnerApplicationRow[] | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  let q = admin
    .from("partner_applications")
    .select(
      "id, company_name, partner_type, contact_name, email, phone, whatsapp, website, instagram, inventory_size, locations, message, status, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (status && status !== "ALL") q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    console.error("[getPartnerApplications]", error.message);
    return null;
  }

  return (data ?? []).map((p: any) => ({
    id: p.id,
    companyName: p.company_name,
    partnerType: p.partner_type,
    contactName: p.contact_name,
    email: p.email,
    phone: p.phone,
    whatsapp: p.whatsapp,
    website: p.website,
    instagram: p.instagram,
    inventorySize: p.inventory_size,
    locations: p.locations ?? [],
    message: p.message,
    status: p.status,
    createdAt: p.created_at,
  }));
}
