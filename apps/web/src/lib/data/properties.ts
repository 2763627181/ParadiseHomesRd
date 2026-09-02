import "server-only";

import { cache } from "react";
import type { Paginated, Property, PropertySummary } from "@paradise/types";
import type { ParsedPropertySearchParams } from "@paradise/validation";

import { isSupabaseConfigured } from "@/lib/env";
import {
  demoAllPropertySlugs,
  demoFeaturedProperties,
  demoNewProperties,
  demoPropertyByCode,
  demoPropertyBySlug,
  demoSearchProperties,
  demoSimilarProperties,
  type DemoSearchResult,
} from "./demo-store";

/**
 * Capa de acceso a propiedades. Hoy sirve datos demo en memoria; cuando
 * `isSupabaseConfigured`, cada función consultará `property_summaries` / `properties`
 * (misma firma pública, sin tocar las rutas).
 */

export const getFeaturedProperties = cache(async (limit = 8): Promise<PropertySummary[]> => {
  if (isSupabaseConfigured) {
    // TODO(fase 1): SELECT * FROM property_summaries WHERE status='PUBLISHED' ORDER BY is_featured DESC, published_at DESC
  }
  return demoFeaturedProperties(limit);
});

export const getNewProperties = cache(async (limit = 8): Promise<PropertySummary[]> => {
  return demoNewProperties(limit);
});

export interface PropertySearchResponse extends Paginated<PropertySummary> {
  mapPoints: DemoSearchResult["mapPoints"];
}

export async function searchProperties(
  params: ParsedPropertySearchParams,
): Promise<PropertySearchResponse> {
  const result = demoSearchProperties(params);
  return {
    items: result.items,
    total: result.total,
    nextCursor: result.nextCursor,
    mapPoints: result.mapPoints,
  };
}

export const getPropertyBySlug = cache(async (slug: string): Promise<Property | null> => {
  return demoPropertyBySlug(slug);
});

export const getPropertyByCode = cache(async (code: string): Promise<Property | null> => {
  return demoPropertyByCode(code);
});

export async function getSimilarProperties(
  property: Property,
  limit = 4,
): Promise<PropertySummary[]> {
  return demoSimilarProperties(property, limit);
}

export async function getAllPropertySlugs(): Promise<string[]> {
  return demoAllPropertySlugs();
}
