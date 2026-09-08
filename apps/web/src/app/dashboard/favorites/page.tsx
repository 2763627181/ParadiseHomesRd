import type { Metadata } from "next";

import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { FavoritesList } from "@/components/favorites/favorites-list";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: "overview" },
  { label: "Favoritos", href: "/dashboard/favorites", icon: "favorites" },
  { label: "Mensajes", href: "/dashboard/messages", icon: "messages" },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: "notifications" },
  { label: "Búsquedas guardadas", href: "/dashboard/searches", icon: "search" },
  { label: "Mis consultas", href: "/dashboard/inquiries", icon: "inbox" },
  { label: "Visitas", href: "/dashboard/visits", icon: "visits" },
  { label: "Alertas", href: "/dashboard/alerts", icon: "alerts" },
  { label: "Perfil", href: "/dashboard/profile", icon: "profile" },
];

export default function DashboardFavoritesPage() {
  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Favoritos</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Las propiedades y proyectos que guardaste. Con la sesión iniciada se sincronizan entre tus
        dispositivos.
      </p>
      <FavoritesList />
    </DashboardShell>
  );
}
