import type { Metadata } from "next";

import { getAdminAgents } from "@/lib/data/admin";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { AgentsTable } from "@/components/admin/agents-table";

export const metadata: Metadata = { title: "Agentes · Admin", robots: { index: false } };
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
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

export default async function AdminAgentsPage() {
  const rows = await getAdminAgents();

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Agentes</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {rows ? `${rows.length} agente${rows.length === 1 ? "" : "s"}` : "Directorio de agentes"}
        {" · "}la verificación se otorga desde{" "}
        <a href="/admin/verifications" className="underline underline-offset-2">
          Verificaciones
        </a>
        .
      </p>

      {rows ? (
        <AgentsTable rows={rows} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Conecta Supabase para ver los agentes reales.
        </p>
      )}
    </DashboardShell>
  );
}
