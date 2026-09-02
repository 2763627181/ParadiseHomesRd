import "server-only";

import { cache } from "react";
import type { Project } from "@paradise/types";

import {
  demoFeaturedProjects,
  demoListProjects,
  demoProjectBySlug,
} from "./demo-store";

export const getFeaturedProjects = cache(async (limit = 6): Promise<Project[]> => {
  return demoFeaturedProjects(limit);
});

export const listProjects = cache(async (): Promise<Project[]> => {
  return demoListProjects();
});

export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  return demoProjectBySlug(slug);
});

export async function getAllProjectSlugs(): Promise<string[]> {
  return demoListProjects().map((p) => p.slug);
}
