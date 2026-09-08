import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getConversation, getMessages } from "@/lib/data/messaging";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { MessageThread } from "@/components/messaging/message-thread";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Conversación", robots: { index: false } };
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

export default async function BuyerConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    return (
      <DashboardShell title="Mi cuenta" nav={NAV}>
        <DashboardLoginPrompt next={`/dashboard/messages/${id}`} />
      </DashboardShell>
    );
  }

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  const allowed =
    isStaffUser(user) ||
    conversation.buyerId === user.id ||
    (user.agentId != null && conversation.agentId === user.agentId);
  if (!allowed) {
    return (
      <DashboardShell title="Mi cuenta" nav={NAV}>
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No tienes acceso a esta conversación.
        </p>
      </DashboardShell>
    );
  }

  const messages = await getMessages(id);

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/dashboard/messages">
          <ChevronLeftIcon className="size-4" />
          Todas las conversaciones
        </Link>
      </Button>

      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">{conversation.agentName}</h1>
        {conversation.propertyTitle && (
          <p className="text-sm text-muted-foreground">
            {conversation.propertySlug ? (
              <Link href={`/property/${conversation.propertySlug}`} className="hover:underline">
                {conversation.propertyTitle}
              </Link>
            ) : (
              conversation.propertyTitle
            )}
          </p>
        )}
      </div>

      <MessageThread
        conversationId={id}
        viewerId={user.id}
        initialMessages={messages}
        counterpartName={conversation.agentName}
        counterpartAvatarUrl={conversation.agentAvatarUrl}
        className="h-[calc(100dvh-16rem)] min-h-[24rem]"
      />
    </DashboardShell>
  );
}
