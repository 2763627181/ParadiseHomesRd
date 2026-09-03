import "server-only";

import { cache } from "react";
import type { Project } from "@paradise/types";

import { isSupabaseConfigured } from "@/lib/env";
import { demoFeaturedProjects, demoListProjects, demoProjectBySlug } from "./demo-store";
import { sbGetProjectBySlug, sbListProjects } from "./supabase/catalog";

export const listProjects = cache(async (): Promise<Project[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbListProjects();
    if (rows && rows.length) return rows;
  }
  return demoListProjects();
});

export const getFeaturedProjects = cache(async (limit = 6): Promise<Project[]> => {
  const all = await listProjects();
  return all.length ? all.slice(0, limit) : demoFeaturedProjects(limit);
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
