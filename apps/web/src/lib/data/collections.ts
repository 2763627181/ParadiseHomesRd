import "server-only";

import type { Property, ProjectSummary, PropertySummary } from "@paradise/types";

import { demoProjects, demoProperties, demoPropertySummaries } from "@paradise/database";

import { isSupabaseConfigured } from "@/lib/env";
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
