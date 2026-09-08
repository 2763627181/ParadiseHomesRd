import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { CsvImport } from "@/components/dashboard/csv-import";

export const metadata: Metadata = { title: "Importar · Inmobiliaria", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agency/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agency/dashboard/properties", icon: "home" },
  { label: "Proyectos", href: "/agency/dashboard/projects", icon: "buildings" },
  { label: "Asesores", href: "/agency/dashboard/agents", icon: "users" },
  { label: "Leads", href: "/agency/dashboard/leads", icon: "leads" },
  { label: "Visitas", href: "/agency/dashboard/visits", icon: "visits" },
  { label: "Cierres", href: "/agency/dashboard/closings", icon: "closings" },
  { label: "Importar", href: "/agency/dashboard/import", icon: "import" },
  { label: "Analytics", href: "/agency/dashboard/analytics", icon: "analytics" },
  { label: "Ajustes", href: "/agency/dashboard/settings", icon: "settings" },
];

export default async function AgencyImportPage() {
  const user = await getSessionUser();
  const canImport = Boolean(user?.memberships.some((m) => m.organizationType === "agency"));

  return (
    <DashboardShell title="Inmobiliaria" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Importar inventario</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Sube un CSV con tus propiedades y créalas todas de una vez. Hasta 200 por archivo.
      </p>
      <CsvImport canImport={canImport} />
    </DashboardShell>
  );
}
