import "server-only";

import { cache } from "react";
import type { Location } from "@paradise/types";

import { isSupabaseConfigured } from "@/lib/env";
import { demoFeaturedLocations, demoLocationBySlug, demoLocationChildren } from "./demo-store";
import { sbGetFeaturedLocations, sbGetLocationBySlug } from "./supabase/catalog";

export const getFeaturedLocations = cache(async (): Promise<Location[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbGetFeaturedLocations();
    if (rows) return rows;
  }
  return demoFeaturedLocations();
});

export const getLocationBySlug = cache(async (slug: string): Promise<Location | null> => {
  if (isSupabaseConfigured) {
    const loc = await sbGetLocationBySlug(slug);
    if (loc !== undefined) return loc;
  }
  return demoLocationBySlug(slug);
});

export const getLocationChildren = cache(async (slug: string): Promise<Location[]> =>
  demoLocationChildren(slug),
);
