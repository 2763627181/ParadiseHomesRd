import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getConversationsForBuyer } from "@/lib/data/messaging";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { ConversationList } from "@/components/messaging/conversation-list";

export const metadata: Metadata = { title: "Mensajes", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: "overview" },
  { label: "Favoritos", href: "/favorites", icon: "favorites" },
  { label: "Mensajes", href: "/dashboard/messages", icon: "messages" },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: "notifications" },
  { label: "Búsquedas guardadas", href: "/dashboard/searches", icon: "search" },
  { label: "Mis consultas", href: "/dashboard/inquiries", icon: "inbox" },
  { label: "Visitas", href: "/dashboard/visits", icon: "visits" },
  { label: "Alertas", href: "/dashboard/alerts", icon: "alerts" },
  { label: "Perfil", href: "/dashboard/profile", icon: "profile" },
];

export default async function BuyerMessagesPage() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <DashboardShell title="Mi cuenta" nav={NAV}>
        <h1 className="mb-5 text-xl font-semibold tracking-tight">Mensajes</h1>
        <DashboardLoginPrompt next="/dashboard/messages" />
      </DashboardShell>
    );
  }

  const conversations = await getConversationsForBuyer(user.id);

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Mensajes</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Tus conversaciones con asesores sobre las propiedades que te interesan.
      </p>
      <ConversationList
        conversations={conversations}
        basePath="/dashboard/messages"
        emptyTitle="Aún no tienes conversaciones"
        emptyDescription="Escríbele a un asesor desde una propiedad o desde “Mis consultas” para empezar."
      />
    </DashboardShell>
  );
}
