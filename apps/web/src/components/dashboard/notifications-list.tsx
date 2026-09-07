"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckCheckIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import type { NotificationRow } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";

const TYPE_LABELS: Record<string, string> = {
  lead_new: "Nueva consulta",
  message_new: "Mensaje",
  visit_scheduled: "Visita",
  visit_cancelled: "Visita",
  property_approved: "Propiedad",
  property_rejected: "Propiedad",
  closing_registered: "Cierre",
  verified: "Verificación",
};

/** Lista completa de notificaciones para /dashboard/notifications. */
export function NotificationsList({ items, unread }: { items: NotificationRow[]; unread: number }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = React.useTransition();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const refreshBell = () => void queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAll = () => {
    startTransition(async () => {
      const res = await markAllNotificationsRead();
      if (!res.ok) {
        toast.error(res.message ?? "No se pudo actualizar");
        return;
      }
      refreshBell();
      router.refresh();
    });
  };

  const openItem = async (item: NotificationRow) => {
    if (!item.readAt) {
      setBusyId(item.id);
      const res = await markNotificationRead(item.id);
      setBusyId(null);
      if (!res.ok) toast.error(res.message ?? "No se pudo actualizar");
      refreshBell();
    }
    if (item.href) router.push(item.href);
    else router.refresh();
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={BellIcon}
        title="Sin notificaciones"
        description="Aquí verás mensajes de asesores, visitas agendadas y novedades de tus propiedades."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {unread > 0 ? `${unread} sin leer` : "Todo al día"}
        </p>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAll} disabled={pending}>
            {pending ? <Loader2Icon className="animate-spin" /> : <CheckCheckIcon />}
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/70 bg-card">
        {items.map((item) => {
          const isUnread = !item.readAt;
          const busy = busyId === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => void openItem(item)}
                disabled={busy}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary/60 disabled:opacity-70 sm:px-5",
                  isUnread && "bg-accent-subtle/40",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-2 size-2 shrink-0 rounded-full",
                    isUnread ? "bg-primary" : "bg-transparent",
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span
                      className={cn(
                        "text-sm",
                        isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                      )}
                    >
                      {item.title}
                    </span>
                    {TYPE_LABELS[item.type] && (
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {TYPE_LABELS[item.type]}
                      </span>
                    )}
                  </span>
                  {item.body && (
                    <span className="mt-0.5 block text-sm text-muted-foreground">{item.body}</span>
                  )}
                  <span className="mt-1 block text-xs text-muted-foreground/80">
                    {formatRelativeRd(item.createdAt)}
                  </span>
                </span>
                {busy ? (
                  <Loader2Icon className="mt-1 size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  item.href && <ChevronRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
