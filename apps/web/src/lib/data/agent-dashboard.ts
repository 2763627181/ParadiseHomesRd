import "server-only";

import { demoAgents, demoProperties } from "@paradise/database";
import type { PropertyStatus } from "@paradise/config";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Datos del panel del asesor (`/agent/dashboard/*`). A diferencia de
 * `lib/data/people.ts` (que solo expone propiedades PUBLICADAS para las
 * páginas públicas), aquí se listan TODOS los estados de una propiedad —
 * incluidos borradores y pendientes de revisión — porque el asesor necesita
 * ver el estado real de sus publicaciones.
 */

export interface AgentPropertyRow {
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
  createdAt: string;
}

export async function getAgentPropertyRows(agentId: string): Promise<AgentPropertyRow[]> {
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
           images:property_images(url, is_cover, position)`,
        )
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[getAgentPropertyRows]", error.message);
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
            createdAt: p.created_at,
          };
        });
      }
    }
  }

  return demoProperties
    .filter((p) => p.agent?.id === agentId)
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
      createdAt: p.createdAt,
    }));
}

export interface AgentProfileRow {
  id: string;
  slug: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  avatarUrl: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  languages: string[];
  areas: string[];
  isVerified: boolean;
}

/** Perfil propio del asesor (para el formulario de edición). */
export async function getAgentProfileRow(agentId: string): Promise<AgentProfileRow | null> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("agents")
        .select("id, slug, full_name, title, bio, avatar_url, email, phone, whatsapp, languages, areas, is_verified")
        .eq("id", agentId)
        .maybeSingle();
      if (error) {
        console.error("[getAgentProfileRow]", error.message);
      } else if (data) {
        return {
          id: data.id,
          slug: data.slug,
          fullName: data.full_name,
          title: data.title,
          bio: data.bio,
          avatarUrl: data.avatar_url,
          email: data.email,
          phone: data.phone,
          whatsapp: data.whatsapp,
          languages: data.languages ?? [],
          areas: data.areas ?? [],
          isVerified: data.is_verified,
        };
      }
    }
  }

  const demo = demoAgents.find((a) => a.id === agentId);
  if (!demo) return null;
  return {
    id: demo.id,
    slug: demo.slug,
    fullName: demo.fullName,
    title: demo.title,
    bio: demo.bio,
    avatarUrl: demo.avatarUrl,
    email: demo.email,
    phone: demo.phone,
    whatsapp: demo.whatsapp,
    languages: demo.languages,
    areas: demo.areas,
    isVerified: demo.isVerified,
  };
}
