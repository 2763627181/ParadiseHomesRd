import type { Metadata } from "next";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardComingSoon } from "@/components/dashboard/dashboard-coming-soon";

export const metadata: Metadata = { title: "Analytics · Asesor", robots: { index: false } };

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agent/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agent/dashboard/properties", icon: "home" },
  { label: "Leads", href: "/agent/dashboard/leads", icon: "leads" },
  { label: "Agenda", href: "/agent/dashboard/calendar", icon: "calendar" },
  { label: "Mensajes", href: "/agent/dashboard/messages", icon: "messages" },
  { label: "Analytics", href: "/agent/dashboard/analytics", icon: "analytics" },
  { label: "Perfil", href: "/agent/dashboard/profile", icon: "profile" },
  { label: "Ajustes", href: "/agent/dashboard/settings", icon: "settings" },
];

export default function AgentAnalyticsPage() {
  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <h1 className="mb-5 text-xl font-semibold tracking-tight">Analytics</h1>
      <DashboardComingSoon
        title="Analíticas avanzadas"
        description="Métricas detalladas de tus propiedades: vistas, conversión y comparativas por zona."
      />
    </DashboardShell>
  );
}
