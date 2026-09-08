import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getNotificationsForUser, getUnreadCount } from "@/lib/data/notifications";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { NotificationsList } from "@/components/dashboard/notifications-list";

export const metadata: Metadata = { title: "Notificaciones", robots: { index: false } };
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

export default async function NotificationsPage() {
  const user = await getSessionUser();

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Notificaciones</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Mensajes de asesores, visitas agendadas, estado de tus propiedades y novedades de tu cuenta.
      </p>

      {!user ? (
        <DashboardLoginPrompt next="/dashboard/notifications" />
      ) : (
        <NotificationsContent userId={user.id} />
      )}
    </DashboardShell>
  );
}

async function NotificationsContent({ userId }: { userId: string }) {
  const [items, unread] = await Promise.all([
    getNotificationsForUser(userId, { limit: 100 }),
    getUnreadCount(userId),
  ]);
  return <NotificationsList items={items} unread={unread} />;
}
