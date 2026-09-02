import type { MetadataRoute } from "next";
import { LOCATIONS } from "@paradise/config";

import { env } from "@/lib/env";
import { getAllPropertySlugs } from "@/lib/data/properties";
import { getAllProjectSlugs } from "@/lib/data/projects";
import { listAgencies, listAgents } from "@/lib/data/people";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL.replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    "",
    "/buy",
    "/rent",
    "/properties",
    "/projects",
    "/agents",
    "/agencies",
    "/partners",
    "/partners/apply",
    "/mortgage-calculator",
    "/faq",
    "/about",
    "/contact",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const locationRoutes = LOCATIONS.filter((l) => l.type !== "COUNTRY").map((l) => ({
    url: `${base}/properties/${l.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const [propertySlugs, projectSlugs, agents, agencies] = await Promise.all([
    getAllPropertySlugs(),
    getAllProjectSlugs(),
    listAgents(),
    listAgencies(),
  ]);

  return [
    ...staticRoutes,
    ...locationRoutes,
    ...propertySlugs.map((slug) => ({
      url: `${base}/property/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...projectSlugs.map((slug) => ({
      url: `${base}/project/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...agents.map((a) => ({ url: `${base}/agent/${a.slug}`, lastModified: now, priority: 0.5 })),
    ...agencies.map((a) => ({ url: `${base}/agency/${a.slug}`, lastModified: now, priority: 0.5 })),
  ];
}
