import type { Metadata } from "next";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardComingSoon } from "@/components/dashboard/dashboard-coming-soon";

export const metadata: Metadata = { title: "Contenido · Admin", robots: { index: false } };

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

export default function AdminContentPage() {
  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Contenido</h1>
      <DashboardComingSoon
        title="Gestión de contenido"
        description="Editor para el blog y guías del mercado. Estas secciones siguen deliberadamente vacías en el sitio público hasta tener contenido real (sin estadísticas inventadas)."
      />
    </DashboardShell>
  );
}
