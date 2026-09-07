import "server-only";

import { demoDevelopers, demoProjects } from "@paradise/database";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Datos del panel de la desarrolladora (`/developer/dashboard/*`). Espeja
 * `lib/data/agency-dashboard.ts`: se listan TODOS los estados de los proyectos
 * de la desarrolladora (no solo los publicados), porque el panel necesita
 * reflejar borradores y publicaciones en revisión. Supabase primero (con
 * cliente service-role) y datos demo como respaldo.
 */

export interface DeveloperProjectRow {
  id: string;
  code: string;
  slug: string;
  name: string;
  status: string;
  unitCount: number;
  isVerified: boolean;
  createdAt: string;
}

export async function getDeveloperProjectRows(developerId: string): Promise<DeveloperProjectRow[]> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("projects")
        .select(
          `id, code, slug, name, status, is_verified, created_at,
           units:project_units(id)`,
        )
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("[getDeveloperProjectRows]", error.message);
      } else {
        return (data ?? []).map((p: any) => ({
          id: p.id,
          code: p.code,
          slug: p.slug,
          name: p.name,
          status: p.status,
          unitCount: (p.units ?? []).length,
          isVerified: p.is_verified,
          createdAt: p.created_at,
        }));
      }
    }
  }

  return demoProjects
    .filter((p) => p.developer?.id === developerId)
    .map((p) => ({
      id: p.id,
      code: p.code,
      slug: p.slug,
      name: p.name,
      status: p.status,
      unitCount: p.units.length,
      isVerified: p.isVerified,
      createdAt: p.createdAt,
    }));
}

export interface DeveloperOverviewStats {
  projectCount: number;
  unitCount: number;
  leadCount: number;
}

export async function getDeveloperOverviewStats(developerId: string): Promise<DeveloperOverviewStats> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const [{ data: projects, error: projectsError }, { count: leadCount, error: leadsError }] =
        await Promise.all([
          admin
            .from("projects")
            .select("id, units:project_units(id)")
            .eq("developer_id", developerId)
            .limit(500),
          admin
            .from("leads")
            .select("id", { count: "exact", head: true })
            .eq("developer_id", developerId),
        ]);

      if (projectsError) {
        console.error("[getDeveloperOverviewStats]", projectsError.message);
      } else {
        if (leadsError) console.error("[getDeveloperOverviewStats:leads]", leadsError.message);
        const rows = (projects ?? []) as { units: unknown[] | null }[];
        return {
          projectCount: rows.length,
          unitCount: rows.reduce((n, p) => n + (p.units ?? []).length, 0),
          leadCount: leadCount ?? 0,
        };
      }
    }
  }

  const projects = demoProjects.filter((p) => p.developer?.id === developerId);
  return {
    projectCount: projects.length,
    unitCount: projects.reduce((n, p) => n + p.units.length, 0),
    leadCount: 0,
  };
}

export interface DeveloperProfileRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  isVerified: boolean;
}

export async function getDeveloperProfileRow(developerId: string): Promise<DeveloperProfileRow | null> {
  if (isSupabaseConfigured) {
    const admin = getSupabaseAdminClient();
    if (admin) {
      const { data, error } = await admin
        .from("developers")
        .select("id, slug, name, description, logo_url, cover_image_url, website, phone, whatsapp, is_verified")
        .eq("id", developerId)
        .maybeSingle();
      if (error) {
        console.error("[getDeveloperProfileRow]", error.message);
      } else if (data) {
        return {
          id: data.id,
          slug: data.slug,
          name: data.name,
          description: data.description,
          logoUrl: data.logo_url,
          coverImageUrl: data.cover_image_url,
          website: data.website,
          phone: data.phone,
          whatsapp: data.whatsapp,
          isVerified: data.is_verified,
        };
      }
    }
  }

  const demo = demoDevelopers.find((d) => d.id === developerId);
  if (!demo) return null;
  return {
    id: demo.id,
    slug: demo.slug,
    name: demo.name,
    description: demo.description,
    logoUrl: demo.logoUrl,
    coverImageUrl: demo.coverImageUrl,
    website: demo.website,
    phone: demo.phone,
    whatsapp: demo.whatsapp,
    isVerified: demo.isVerified,
  };
}
