import type { Metadata } from "next";

import { getAdminDevelopers } from "@/lib/data/admin";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DevelopersTable } from "@/components/admin/developers-table";

export const metadata: Metadata = { title: "Desarrolladoras · Admin", robots: { index: false } };
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
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

export default async function AdminDevelopersPage() {
  const rows = await getAdminDevelopers();

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Desarrolladoras</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {rows ? `${rows.length} desarrolladora${rows.length === 1 ? "" : "s"}` : "Directorio de desarrolladoras"}
      </p>

      {rows ? (
        <DevelopersTable rows={rows} />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Conecta Supabase para ver las desarrolladoras reales.
        </p>
      )}
    </DashboardShell>
  );
}
