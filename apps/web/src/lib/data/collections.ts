import "server-only";

import type { Property, ProjectSummary, PropertySummary } from "@paradise/types";

import { demoProjects, demoProperties, demoPropertySummaries } from "@paradise/database";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { sbGetPropertiesByIds } from "./supabase/properties";
import { listProjects } from "./projects";

/** Resuelve propiedades/proyectos por id (favoritos, comparador, vistas recientes). */
export async function getPropertiesByIds(ids: string[]): Promise<PropertySummary[]> {
  if (!ids.length) return [];
  if (isSupabaseConfigured) {
    const rows = await sbGetPropertiesByIds(ids);
    if (rows && rows.length) return rows;
  }
  const set = new Set(ids);
  return demoPropertySummaries.filter((p) => set.has(p.id));
}

/** Igual que {@link getPropertiesByIds} pero conserva los campos completos (comparador). */
export async function getFullPropertiesByIds(ids: string[]): Promise<Property[]> {
  if (!ids.length) return [];
  if (isSupabaseConfigured) {
    const rows = await sbGetPropertiesByIds(ids);
    if (rows && rows.length) return rows;
  }
  const set = new Set(ids);
  return demoProperties.filter((p) => set.has(p.id));
}

export async function getProjectsByIds(ids: string[]): Promise<ProjectSummary[]> {
  if (!ids.length) return [];
  const set = new Set(ids);
  const all = await listProjects();
  const matched = all.filter((p) => set.has(p.id));
  if (matched.length) return matched;
  return demoProjects.filter((p) => set.has(p.id));
}

/** Últimas propiedades vistas por el usuario (orden más reciente primero). */
export async function getRecentlyViewedProperties(
  userId: string,
  limit = 8,
): Promise<PropertySummary[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("recently_viewed")
    .select("property_id, viewed_at")
    .eq("user_id", userId)
    .not("property_id", "is", null)
    .order("viewed_at", { ascending: false })
    .limit(limit * 2);
  if (error || !data) {
    if (error) console.error("[getRecentlyViewedProperties]", error.message);
    return [];
  }
  const orderedIds: string[] = [];
  for (const row of data as { property_id: string }[]) {
    if (!orderedIds.includes(row.property_id)) orderedIds.push(row.property_id);
    if (orderedIds.length >= limit) break;
  }
  if (!orderedIds.length) return [];
  const props = await getPropertiesByIds(orderedIds);
  const byId = new Map(props.map((p) => [p.id, p]));
  return orderedIds.map((id) => byId.get(id)).filter((p): p is PropertySummary => Boolean(p));
}
