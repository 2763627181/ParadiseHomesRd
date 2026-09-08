import type { Metadata } from "next";

import { closingStatCards, getAllClosingsAdmin, summarizeClosings } from "@/lib/data/closings";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StatGrid } from "@/components/dashboard/stat-card";
import { CommissionsTable } from "@/components/admin/commissions-table";

export const metadata: Metadata = { title: "Cierres · Admin", robots: { index: false } };
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

export default async function AdminClosingsPage() {
  const rows = await getAllClosingsAdmin();

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Cierres y comisiones</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Libro de cierres de toda la plataforma. Cambia el estado de cada comisión conforme se factura y
        se paga (Paradise no procesa dinero, es solo registro).
      </p>
      <StatGrid stats={closingStatCards(summarizeClosings(rows))} />
      <div className="mt-6">
        <CommissionsTable rows={rows} />
      </div>
    </DashboardShell>
  );
}
