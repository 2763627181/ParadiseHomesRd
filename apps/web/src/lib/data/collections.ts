import "server-only";

import type { ProjectSummary, PropertySummary } from "@paradise/types";

import { demoProjects, demoPropertySummaries } from "@paradise/database";

/** Resuelve propiedades/proyectos por id (favoritos, comparador, vistas recientes). */
export async function getPropertiesByIds(ids: string[]): Promise<PropertySummary[]> {
  const set = new Set(ids);
  return demoPropertySummaries.filter((p) => set.has(p.id));
}

export async function getProjectsByIds(ids: string[]): Promise<ProjectSummary[]> {
  const set = new Set(ids);
  return demoProjects.filter((p) => set.has(p.id));
}
