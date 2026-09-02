/**
 * Constructores de rutas tipados. Única fuente de verdad para URLs internas,
 * usada por web (y luego mobile / deep links).
 */

export const ROUTES = {
  home: () => "/",
  buy: () => "/buy",
  rent: () => "/rent",

  properties: (query?: Record<string, string | number | undefined>) =>
    withQuery("/properties", query),
  propertiesByLocation: (locationSlug: string) => `/properties/${locationSlug}`,
  property: (slug: string) => `/property/${slug}`,

  projects: (query?: Record<string, string | number | undefined>) => withQuery("/projects", query),
  project: (slug: string) => `/project/${slug}`,

  map: (query?: Record<string, string | number | undefined>) => withQuery("/map", query),

  agents: () => "/agents",
  agent: (slug: string) => `/agent/${slug}`,
  agencies: () => "/agencies",
  agency: (slug: string) => `/agency/${slug}`,
  developer: (slug: string) => `/developers/${slug}`,

  favorites: () => "/favorites",
  compare: (ids?: string[]) => withQuery("/compare", ids?.length ? { ids: ids.join(",") } : undefined),

  partners: () => "/partners",
  partnersApply: () => "/partners/apply",
  listProperty: () => "/list-property",

  market: () => "/market",
  blog: () => "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  mortgageCalculator: () => "/mortgage-calculator",
  faq: () => "/faq",
  about: () => "/about",
  contact: () => "/contact",
  privacy: () => "/privacy",
  terms: () => "/terms",
  cookies: () => "/cookies",

  // Auth
  login: (next?: string) => withQuery("/login", next ? { next } : undefined),
  register: (next?: string) => withQuery("/register", next ? { next } : undefined),
  forgotPassword: () => "/forgot-password",
  authCallback: () => "/auth/callback",

  // Dashboard usuario
  dashboard: () => "/dashboard",
  dashboardFavorites: () => "/dashboard/favorites",
  dashboardSearches: () => "/dashboard/searches",
  dashboardInquiries: () => "/dashboard/inquiries",
  dashboardVisits: () => "/dashboard/visits",
  dashboardProfile: () => "/dashboard/profile",

  // Dashboard agente
  agentDashboard: () => "/agent/dashboard",
  agentProperties: () => "/agent/dashboard/properties",
  agentLeads: () => "/agent/dashboard/leads",
  agentLead: (id: string) => `/agent/dashboard/leads/${id}`,
  agentCalendar: () => "/agent/dashboard/calendar",
  agentMessages: () => "/agent/dashboard/messages",
  agentAnalytics: () => "/agent/dashboard/analytics",
  agentDashboardProfile: () => "/agent/dashboard/profile",
  agentSettings: () => "/agent/dashboard/settings",

  // Dashboard agencia
  agencyDashboard: () => "/agency/dashboard",
  agencyAgents: () => "/agency/dashboard/agents",
  agencyLeads: () => "/agency/dashboard/leads",
  agencyImport: () => "/agency/dashboard/import",
  agencyAnalytics: () => "/agency/dashboard/analytics",
  agencySettings: () => "/agency/dashboard/settings",

  // Admin
  admin: () => "/admin",
  adminProperties: () => "/admin/properties",
  adminProjects: () => "/admin/projects",
  adminUnits: () => "/admin/units",
  adminUsers: () => "/admin/users",
  adminAgents: () => "/admin/agents",
  adminAgencies: () => "/admin/agencies",
  adminDevelopers: () => "/admin/developers",
  adminLeads: () => "/admin/leads",
  adminVisits: () => "/admin/visits",
  adminClosings: () => "/admin/closings",
  adminVerifications: () => "/admin/verifications",
  adminAnalytics: () => "/admin/analytics",
  adminMarketing: () => "/admin/marketing",
  adminContent: () => "/admin/content",
  adminSettings: () => "/admin/settings",
} as const;

function withQuery(
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Deep link scheme para la app móvil (fase 3). */
export const DEEP_LINK_SCHEME = "paradisehomesrd";
export function deepLink(path: string): string {
  return `${DEEP_LINK_SCHEME}://${path.replace(/^\//, "")}`;
}
