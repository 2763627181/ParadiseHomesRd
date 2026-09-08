import type { Metadata } from "next";

import { getAdminVerifications } from "@/lib/data/admin";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import {
  AgencyVerificationTable,
  AgentVerificationTable,
  EntityTabs,
  PropertyVerificationTable,
} from "@/components/admin/verification-tables";

export const metadata: Metadata = { title: "Verificaciones · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/admin", icon: "overview" },
  { label: "Propiedades", href: "/admin/properties", icon: "buildings" },
  { label: "Proyectos", href: "/admin/projects", icon: "projects" },
  { label: "Usuarios", href: "/admin/users", icon: "users" },
  { label: "Agentes", href: "/admin/agents", icon: "agents" },
  { label: "Inmobiliarias", href: "/admin/agencies", icon: "building" },
  { label: "Desarrolladoras", href: "/admin/developers", icon: "developers" },
  { label: "Leads", href: "/admin/leads", icon: "leads" },
  { label: "Verificaciones", href: "/admin/verifications", icon: "verify" },
  { label: "Solicitudes", href: "/admin/partners", icon: "partners" },
  { label: "Cierres", href: "/admin/closings", icon: "closings" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

const TABS = ["properties", "agents", "agencies"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const active: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "properties";
  const result = await getAdminVerifications();

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Verificaciones</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Otorga el sello Paradise Verified a propiedades, agentes e inmobiliarias que cumplen los
        criterios de confianza de la plataforma.
      </p>

      {result ? (
        <>
          <EntityTabs
            active={active}
            counts={{
              properties: result.properties.length,
              agents: result.agents.length,
              agencies: result.agencies.length,
            }}
          />
          {active === "properties" && <PropertyVerificationTable rows={result.properties} />}
          {active === "agents" && <AgentVerificationTable rows={result.agents} />}
          {active === "agencies" && <AgencyVerificationTable rows={result.agencies} />}
        </>
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Conecta Supabase para gestionar verificaciones reales.
        </p>
      )}
    </DashboardShell>
  );
}
