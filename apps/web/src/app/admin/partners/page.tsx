import type { Metadata } from "next";

import { getPartnerApplications } from "@/lib/data/admin";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { PartnerApplicationsTable, PartnerStatusTabs } from "@/components/admin/partner-applications-table";

export const metadata: Metadata = { title: "Solicitudes de socios · Admin", robots: { index: false } };
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

const STATUSES = ["new", "contacted", "approved", "rejected"] as const;
const TABS = [...STATUSES, "ALL"] as const;

export default async function AdminPartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = TABS.includes(status as (typeof TABS)[number]) ? status! : "new";

  const [rows, allRows] = await Promise.all([
    getPartnerApplications(active),
    getPartnerApplications(),
  ]);

  const counts: Record<string, number> = { ALL: allRows?.length ?? 0 };
  for (const s of STATUSES) counts[s] = (allRows ?? []).filter((r) => r.status === s).length;

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Solicitudes de socios</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Revisa las solicitudes enviadas desde /partners/apply. Al aprobar, se crea la cuenta (inmobiliaria,
        desarrolladora o asesor independiente) y se envía una invitación por correo para que definan su
        contraseña.
      </p>

      {rows ? (
        <>
          <PartnerStatusTabs active={active} counts={counts} />
          <PartnerApplicationsTable rows={rows} />
        </>
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Conecta Supabase para gestionar solicitudes reales.
        </p>
      )}
    </DashboardShell>
  );
}
