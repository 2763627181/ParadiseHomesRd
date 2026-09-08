import type { Metadata } from "next";

import { env, serverEnv } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { getStaffUsers } from "@/lib/data/admin";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { StaffManager } from "@/components/admin/staff-manager";

export const metadata: Metadata = { title: "Ajustes · Admin", robots: { index: false } };
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

function Flag({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={on ? "text-success" : "text-muted-foreground"}>{on ? "Activo" : "Inactivo"}</span>
    </div>
  );
}

export default async function AdminSettingsPage() {
  const [user, staff] = await Promise.all([getSessionUser(), getStaffUsers()]);
  const canManage = user?.role === "SUPER_ADMIN";

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Ajustes</h1>
      <p className="mb-6 text-sm text-muted-foreground">Equipo, feature flags y configuración de la plataforma.</p>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Equipo (staff)</h2>
        <StaffManager staff={staff} canManage={canManage} />
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Feature flags</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Flag label="Comparador de propiedades" on={env.FLAGS.compare} />
          <Flag label="Calculadora hipotecaria" on={env.FLAGS.mortgageCalculator} />
          <Flag label="Paradise AI" on={env.FLAGS.paradiseAi} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Se controlan por variables de entorno (<code>NEXT_PUBLIC_ENABLE_*</code>) en Vercel.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Configuración general</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-lg border border-border/70 px-3 py-2">
            <dt className="text-xs text-muted-foreground">URL de la app</dt>
            <dd className="truncate">{env.APP_URL}</dd>
          </div>
          <div className="rounded-lg border border-border/70 px-3 py-2">
            <dt className="text-xs text-muted-foreground">WhatsApp de contacto</dt>
            <dd>{env.ADMIN_WHATSAPP}</dd>
          </div>
          <div className="rounded-lg border border-border/70 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Mapas</dt>
            <dd>OpenStreetMap (sin API key)</dd>
          </div>
          <div className="rounded-lg border border-border/70 px-3 py-2">
            <dt className="text-xs text-muted-foreground">Correos (Resend)</dt>
            <dd>{serverEnv.RESEND_API_KEY ? "Configurado" : "Solo notificaciones in-app"}</dd>
          </div>
        </dl>
      </section>
    </DashboardShell>
  );
}
