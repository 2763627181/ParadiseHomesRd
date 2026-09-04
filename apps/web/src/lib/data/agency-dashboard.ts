import "server-only";

import { demoAgencies, demoAgents, demoProperties } from "@paradise/database";
import type { PropertyStatus } from "@paradise/config";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Datos del panel de la inmobiliaria (`/agency/dashboard/*`). Igual que
 * `lib/data/agent-dashboard.ts`, aquí se listan TODOS los estados de las
 * propiedades/proyectos de la agencia (no solo los publicados), porque el
 * panel necesita reflejar borradores y publicaciones en revisión.
 */

export interface AgencyPropertyRow {
  id: string;
  code: string;
  slug: string;
  title: string;
  status: PropertyStatus;
  propertyType: string;
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  cityName: string | null;
  sectorName: string | null;
  coverUrl: string | null;
  imageCount: number;
  viewCount: number;
  favoriteCount: number;
  agentName: string | null;
  createdAt: string;
}

export async function getAgencyPropertyRows(agencyId: string): Promise<AgencyPropertyRow[]> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("properties")
        .select(
          `id, code, slug, title, status, property_type, price, currency, price_on_request,
           view_count, favorite_count, created_at,
           city:locations!properties_city_id_fkey(name),
           sector:locations!properties_sector_id_fkey(name),
           agent:agents(full_name),
           images:property_images(url, is_cover, position)`,
        )
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) {
        console.error("[getAgencyPropertyRows]", error.message);
      } else {
        return (data ?? []).map((p: any) => {
          const images = (p.images ?? []).sort(
            (a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.position - b.position,
          );
          return {
            id: p.id,
            code: p.code,
            slug: p.slug,
            title: p.title,
            status: p.status,
            propertyType: p.property_type,
            price: p.price == null ? null : Number(p.price),
            currency: p.currency,
            priceOnRequest: p.price_on_request,
            cityName: p.city?.name ?? null,
            sectorName: p.sector?.name ?? null,
            coverUrl: images[0]?.url ?? null,
            imageCount: images.length,
            viewCount: p.view_count ?? 0,
            favoriteCount: p.favorite_count ?? 0,
            agentName: p.agent?.full_name ?? null,
            createdAt: p.created_at,
          };
        });
      }
    }
  }

  return demoProperties
    .filter((p) => p.agency?.id === agencyId)
    .map((p) => ({
      id: p.id,
      code: p.code,
      slug: p.slug,
      title: p.title,
      status: p.status,
      propertyType: p.propertyType,
      price: p.price.amount,
      currency: p.price.currency,
      priceOnRequest: p.price.onRequest ?? false,
      cityName: p.location.city,
      sectorName: p.location.sector,
      coverUrl: p.coverImage?.url ?? null,
      imageCount: p.imageCount,
      viewCount: p.viewCount,
      favoriteCount: p.favoriteCount,
      agentName: p.agent?.fullName ?? null,
      createdAt: p.createdAt,
    }));
}

export interface AgencyProjectRow {
  id: string;
  code: string;
  slug: string;
  name: string;
  status: string;
  developerName: string | null;
  unitCount: number;
  isVerified: boolean;
  createdAt: string;
}

export async function getAgencyProjectRows(agencyId: string): Promise<AgencyProjectRow[]> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("projects")
        .select(
          `id, code, slug, name, status, is_verified, created_at,
           developer:developers(name),
           units:project_units(id)`,
        )
        .eq("agency_id", agencyId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[getAgencyProjectRows]", error.message);
      } else {
        return (data ?? []).map((p: any) => ({
          id: p.id,
          code: p.code,
          slug: p.slug,
          name: p.name,
          status: p.status,
          developerName: p.developer?.name ?? null,
          unitCount: (p.units ?? []).length,
          isVerified: p.is_verified,
          createdAt: p.created_at,
        }));
      }
    }
  }

  // Los proyectos demo pertenecen a desarrolladoras, no a agencias — una
  // agencia demo no tiene proyectos propios en el set de datos de muestra.
  return [];
}

export interface AgencyAgentRow {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  title: string | null;
  isVerified: boolean;
  activeListings: number;
  createdAt: string;
}

export async function getAgencyAgentRows(agencyId: string): Promise<AgencyAgentRow[]> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const [{ data: agents, error: agentsError }, { data: properties, error: propsError }] =
        await Promise.all([
          admin
            .from("agents")
            .select("id, slug, full_name, avatar_url, title, is_verified, created_at")
            .eq("agency_id", agencyId)
            .order("full_name"),
          admin
            .from("properties")
            .select("agent_id")
            .eq("agency_id", agencyId)
            .eq("status", "PUBLISHED"),
        ]);

      if (agentsError) {
        console.error("[getAgencyAgentRows]", agentsError.message);
      } else {
        if (propsError) console.error("[getAgencyAgentRows:properties]", propsError.message);
        const counts = new Map<string, number>();
        for (const row of (properties ?? []) as { agent_id: string | null }[]) {
          if (!row.agent_id) continue;
          counts.set(row.agent_id, (counts.get(row.agent_id) ?? 0) + 1);
        }
        return (agents ?? []).map((a: any) => ({
          id: a.id,
          slug: a.slug,
          fullName: a.full_name,
          avatarUrl: a.avatar_url,
          title: a.title,
          isVerified: a.is_verified,
          activeListings: counts.get(a.id) ?? 0,
          createdAt: a.created_at,
        }));
      }
    }
  }

  const agency = demoAgencies.find((a) => a.id === agencyId);
  if (!agency) return [];
  return demoAgents
    .filter((a) => a.agencySlug === agency.slug)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      fullName: a.fullName,
      avatarUrl: a.avatarUrl,
      title: a.title,
      isVerified: a.isVerified,
      activeListings: demoProperties.filter((p) => p.agent?.id === a.id).length,
      createdAt: a.joinedAt,
    }));
}

export interface AgencyProfileRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  isVerified: boolean;
}

export async function getAgencyProfileRow(agencyId: string): Promise<AgencyProfileRow | null> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("agencies")
        .select("id, slug, name, description, logo_url, cover_image_url, website, phone, whatsapp, email, is_verified")
        .eq("id", agencyId)
        .maybeSingle();
      if (error) {
        console.error("[getAgencyProfileRow]", error.message);
      } else if (data) {
        return {
          id: data.id,
          slug: data.slug,
          name: data.name,
          description: data.description,
          logoUrl: data.logo_url,
          coverImageUrl: data.cover_image_url,
          website: data.website,
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          isVerified: data.is_verified,
        };
      }
    }
  }

  const demo = demoAgencies.find((a) => a.id === agencyId);
  if (!demo) return null;
  return {
    id: demo.id,
    slug: demo.slug,
    name: demo.name,
    description: demo.description,
    logoUrl: demo.logoUrl,
    coverImageUrl: demo.coverImageUrl,
    website: demo.website,
    phone: demo.phone,
    whatsapp: demo.whatsapp,
    email: demo.email,
    isVerified: demo.isVerified,
  };
}
