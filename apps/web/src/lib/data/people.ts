import "server-only";

import { cache } from "react";
import type { Agency, Agent, Developer, Project, PropertySummary } from "@paradise/types";

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

export const listAgents = cache(async (): Promise<Agent[]> => demoListAgents());
export const getAgentBySlug = cache(async (slug: string): Promise<Agent | null> =>
  demoAgentBySlug(slug),
);
export const getAgentProperties = cache(async (agentId: string): Promise<PropertySummary[]> =>
  demoAgentProperties(agentId),
);

export const listAgencies = cache(async (): Promise<Agency[]> => demoListAgencies());
export const getAgencyBySlug = cache(async (slug: string): Promise<Agency | null> =>
  demoAgencyBySlug(slug),
);
export const getAgencyProperties = cache(async (agencyId: string): Promise<PropertySummary[]> =>
  demoAgencyProperties(agencyId),
);
export const getAgencyAgents = cache(async (agencySlug: string): Promise<Agent[]> =>
  demoAgencyAgents(agencySlug),
);

export const getDeveloperBySlug = cache(async (slug: string): Promise<Developer | null> =>
  demoDeveloperBySlug(slug),
);
export const getDeveloperProjects = cache(async (developerSlug: string): Promise<Project[]> =>
  demoDeveloperProjects(developerSlug),
);
