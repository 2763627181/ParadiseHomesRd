import "server-only";

import { cache } from "react";
import type { Agency, Agent, Developer, Project, PropertySummary } from "@paradise/types";

import { isSupabaseConfigured } from "@/lib/env";
import {
  demoAgencyAgents,
  demoAgencyBySlug,
  demoAgencyProperties,
  demoAgentBySlug,
  demoAgentProperties,
  demoDeveloperBySlug,
  demoDeveloperProjects,
  demoListAgencies,
  demoListAgents,
} from "./demo-store";
import { listProjects } from "./projects";
import {
  sbGetAgencyBySlug,
  sbGetAgentBySlug,
  sbGetDeveloperBySlug,
  sbListAgencies,
  sbListAgents,
  sbPropertiesBy,
} from "./supabase/catalog";

// ── Agentes ────────────────────────────────────────────────────────────────
export const listAgents = cache(async (): Promise<Agent[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbListAgents();
    if (rows && rows.length) return rows;
  }
  return demoListAgents();
});

export const getAgentBySlug = cache(async (slug: string): Promise<Agent | null> => {
  if (isSupabaseConfigured) {
    const agent = await sbGetAgentBySlug(slug);
    if (agent !== undefined) return agent;
  }
  return demoAgentBySlug(slug);
});

export const getAgentProperties = cache(async (agentId: string): Promise<PropertySummary[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbPropertiesBy("agent_id", agentId);
    if (rows) return rows;
  }
  return demoAgentProperties(agentId);
});

// ── Agencias ───────────────────────────────────────────────────────────────
export const listAgencies = cache(async (): Promise<Agency[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbListAgencies();
    if (rows && rows.length) return rows;
  }
  return demoListAgencies();
});

export const getAgencyBySlug = cache(async (slug: string): Promise<Agency | null> => {
  if (isSupabaseConfigured) {
    const agency = await sbGetAgencyBySlug(slug);
    if (agency !== undefined) return agency;
  }
  return demoAgencyBySlug(slug);
});

export const getAgencyProperties = cache(async (agencyId: string): Promise<PropertySummary[]> => {
  if (isSupabaseConfigured) {
    const rows = await sbPropertiesBy("agency_id", agencyId);
    if (rows) return rows;
  }
  return demoAgencyProperties(agencyId);
});

export const getAgencyAgents = cache(async (agencySlug: string): Promise<Agent[]> => {
  const agents = await listAgents();
  const scoped = agents.filter((a) => a.agencySlug === agencySlug);
  return scoped.length ? scoped : demoAgencyAgents(agencySlug);
});

// ── Desarrolladoras ────────────────────────────────────────────────────────
export const getDeveloperBySlug = cache(async (slug: string): Promise<Developer | null> => {
  if (isSupabaseConfigured) {
    const dev = await sbGetDeveloperBySlug(slug);
    if (dev !== undefined) return dev;
  }
  return demoDeveloperBySlug(slug);
});

export const getDeveloperProjects = cache(async (developerSlug: string): Promise<Project[]> => {
  if (isSupabaseConfigured) {
    const all = await listProjects();
    const scoped = all.filter((p) => p.developer?.slug === developerSlug);
    if (scoped.length) return scoped;
  }
  return demoDeveloperProjects(developerSlug);
});
