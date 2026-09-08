import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";

import { getSessionUser, isStaffUser } from "@/lib/auth";
import { getConversation, getConversationsForAgent, getMessages } from "@/lib/data/messaging";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { ConversationList } from "@/components/messaging/conversation-list";
import { MessageThread } from "@/components/messaging/message-thread";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Conversación · Asesor", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/agent/dashboard", icon: "overview" },
  { label: "Propiedades", href: "/agent/dashboard/properties", icon: "home" },
  { label: "Leads", href: "/agent/dashboard/leads", icon: "leads" },
  { label: "Agenda", href: "/agent/dashboard/calendar", icon: "calendar" },
  { label: "Mensajes", href: "/agent/dashboard/messages", icon: "messages" },
  { label: "Cierres", href: "/agent/dashboard/closings", icon: "closings" },
  { label: "Analytics", href: "/agent/dashboard/analytics", icon: "analytics" },
  { label: "Perfil", href: "/agent/dashboard/profile", icon: "profile" },
  { label: "Ajustes", href: "/agent/dashboard/settings", icon: "settings" },
];

export default async function AgentConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, conversation] = await Promise.all([getSessionUser(), getConversation(id)]);
  if (!conversation) notFound();

  const allowed =
    user &&
    (isStaffUser(user) ||
      conversation.buyerId === user.id ||
      (user.agentId != null && conversation.agentId === user.agentId));

  if (!allowed) {
    return (
      <DashboardShell title="Asesor" nav={NAV}>
        <p className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No tienes acceso a esta conversación.
        </p>
      </DashboardShell>
    );
  }

  const [messages, conversations] = await Promise.all([
    getMessages(id),
    user?.agentId ? getConversationsForAgent(user.agentId, user.id) : Promise.resolve([]),
  ]);

  return (
    <DashboardShell title="Asesor" nav={NAV}>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/agent/dashboard/messages">
          <ChevronLeftIcon className="size-4" />
          Todas las conversaciones
        </Link>
      </Button>

      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">{conversation.buyerName}</h1>
        <p className="text-sm text-muted-foreground">
          {conversation.propertyTitle ? (
            conversation.propertySlug ? (
              <Link href={`/property/${conversation.propertySlug}`} className="hover:underline">
                {conversation.propertyTitle}
              </Link>
            ) : (
              conversation.propertyTitle
            )
          ) : (
            "Conversación"
          )}
          {conversation.leadId && (
            <>
              {" · "}
              <Link href={`/agent/dashboard/leads/${conversation.leadId}`} className="hover:underline">
                Ver lead {conversation.leadCode ?? ""}
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="hidden lg:block">
          <ConversationList
            conversations={conversations}
            basePath="/agent/dashboard/messages"
            activeId={id}
            compact
            emptyTitle="Sin otras conversaciones"
          />
        </aside>
        <MessageThread
          conversationId={id}
          viewerId={user?.agentId ? user.id : null}
          initialMessages={messages}
          counterpartName={conversation.buyerName}
          counterpartAvatarUrl={conversation.buyerAvatarUrl}
          className="h-[calc(100dvh-18rem)] min-h-[24rem]"
        />
      </div>
    </DashboardShell>
  );
}
