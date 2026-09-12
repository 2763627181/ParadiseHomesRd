import "server-only";

import { cache } from "react";
import type { Project } from "@paradise/types";

import { isSupabaseConfigured } from "@/lib/env";
import { demoListProjects, demoProjectBySlug } from "./demo-store";
import { sbGetProjectBySlug, sbListProjects } from "./supabase/catalog";

export const listProjects = cache(async (): Promise<Project[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbListProjects();
    // `null` => sin backend real o error; un array vacío es una respuesta
    // real (catálogo sin proyectos) y no debe disfrazarse con datos demo.
    if (rows) return rows;
  }
  return demoListProjects();
});

export const getFeaturedProjects = cache(async (limit = 6): Promise<Project[]> => {
  const all = await listProjects();
  return all.slice(0, limit);
});

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  if (isSupabaseConfigured) {
    const project = await sbGetProjectBySlug(slug);
    if (project !== undefined) return project;
  }
  return demoProjectBySlug(slug);
});

export async function getAllProjectSlugs(): Promise<string[]> {
  const all = await listProjects();
  return all.map((p) => p.slug);
}
