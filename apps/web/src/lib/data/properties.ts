import "server-only";

import { cache } from "react";
import type { Property, PropertySummary } from "@paradise/types";
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
import {
  sbAllPublishedSlugs,
  sbGetFeaturedProperties,
  sbGetPropertyBySlug,
  sbSearchProperties,
  sbSimilarProperties,
} from "./supabase/properties";

export interface PropertySearchResponse {
  items: PropertySummary[];
  total: number;
  nextCursor: string | null;
  mapPoints: DemoSearchResult["mapPoints"];
}

export const getFeaturedProperties = cache(async (limit = 8): Promise<PropertySummary[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbGetFeaturedProperties(limit);
    // `rows` es `null` si la consulta falló (sin backend real disponible);
    // un array vacío es una respuesta real (catálogo sin propiedades) y no
    // debe disfrazarse con datos demo.
    if (rows) return rows;
  }
  return demoFeaturedProperties(limit);
});

export const getNewProperties = cache(async (limit = 8): Promise<PropertySummary[]> => {
  return demoNewProperties(limit);
});

export async function searchProperties(
  params: ParsedPropertySearchParams,
): Promise<PropertySearchResponse> {
  if (isSupabaseConfigured) {
    const result = await sbSearchProperties(params);
    if (result) return result;
  }
  const result = demoSearchProperties(params);
  return {
    items: result.items,
    total: result.total,
    nextCursor: result.nextCursor,
    mapPoints: result.mapPoints,
  };
}

export const getPropertyBySlug = cache(async (slug: string): Promise<Property | null> => {
  if (isSupabaseConfigured) {
    const property = await sbGetPropertyBySlug(slug);
    if (property !== undefined) return property; // null => 404 real; objeto => encontrado
  }
  return demoPropertyBySlug(slug);
});

export const getPropertyByCode = cache(async (code: string): Promise<Property | null> => {
  return demoPropertyByCode(code);
});

export async function getSimilarProperties(
  property: Property,
  limit = 4,
): Promise<PropertySummary[]> {
  if (isSupabaseConfigured) {
    const rows = await sbSimilarProperties(property, limit);
    if (rows) return rows;
  }
  return demoSimilarProperties(property, limit);
}

export async function getAllPropertySlugs(): Promise<string[]> {
  if (isSupabaseConfigured) {
    const supabaseSlugs = await sbAllPublishedSlugs();
    if (supabaseSlugs) return supabaseSlugs;
  }
  return demoAllPropertySlugs();
}
