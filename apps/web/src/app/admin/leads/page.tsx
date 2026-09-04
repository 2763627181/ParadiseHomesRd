import type { Metadata } from "next";

import { getAllLeadsAdmin } from "@/lib/data/leads";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { LeadsStatusFilter, LeadsTable } from "@/components/dashboard/leads-table";

export const metadata: Metadata = { title: "Leads · Admin", robots: { index: false } };
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

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const allLeads = await getAllLeadsAdmin();
  const leads = status && status !== "ALL" ? allLeads.filter((l) => l.status === status) : allLeads;

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Leads de toda la plataforma</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        {allLeads.length} lead{allLeads.length === 1 ? "" : "s"} · de todos los agentes e
        inmobiliarias.
      </p>
      <LeadsStatusFilter basePath="/admin/leads" active={status ?? "ALL"} />
      <LeadsTable leads={leads} detailBase="/agent/dashboard/leads" />
    </DashboardShell>
  );
}
