"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import type { NotificationRow } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface NotificationsResponse {
  items: NotificationRow[];
  unread: number;
}

const EMPTY: NotificationsResponse = { items: [], unread: 0 };
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;

/**
 * Campana de notificaciones del header. Solo se renderiza con sesión activa.
 * Datos: polling cada 15 s a `/api/notifications` + (si la tabla está en la
 * publicación Realtime, ver migración 0011) suscripción a INSERT propios que
 * invalida la query al instante. Ambos caminos toleran la ausencia del otro.
 */
export function NotificationsBell() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [userId, setUserId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  // Detección de sesión (misma idea que UserMenu, sin compartir estado).
  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let mounted = true;

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) setUserId(user?.id ?? null);
    };

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const query = useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, "bell", userId],
    enabled: Boolean(userId),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await fetch("/api/notifications?limit=8", { cache: "no-store" });
      if (res.status === 401) return EMPTY;
      if (!res.ok) throw new Error(`notifications ${res.status}`);
      return res.json();
    },
  });

  // Realtime (opcional): INSERT en `notifications` para este usuario → refetch.
  React.useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let channel: ReturnType<SupabaseClient["channel"]> | null = null;
    try {
      channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          () => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
        )
        .subscribe();
    } catch (err) {
      console.warn("[NotificationsBell] realtime no disponible", err);
    }

    return () => {
      if (!channel) return;
      try {
        void supabase.removeChannel(channel);
      } catch {
        // ignorar: el canal ya estaba cerrado
      }
    };
  }, [userId, queryClient]);

  React.useEffect(() => setOpen(false), [pathname]);

  if (!userId) return null;

  const data = query.data ?? EMPTY;
  const unread = data.unread;

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

  const openItem = (item: NotificationRow) => {
    setOpen(false);
    // Optimista: quitamos el punto sin esperar al servidor.
    if (!item.readAt) {
      queryClient.setQueryData<NotificationsResponse>(
        [...NOTIFICATIONS_QUERY_KEY, "bell", userId],
        (prev) =>
          prev && {
            unread: Math.max(0, prev.unread - 1),
            items: prev.items.map((n) =>
              n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
            ),
          },
      );
      void markNotificationRead(item.id).finally(invalidate);
    }
    router.push(item.href ?? "/dashboard/notifications");
  };

  const markAll = async () => {
    queryClient.setQueryData<NotificationsResponse>(
      [...NOTIFICATIONS_QUERY_KEY, "bell", userId],
      (prev) =>
        prev && {
          unread: 0,
          items: prev.items.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
        },
    );
    await markAllNotificationsRead();
    invalidate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={unread > 0 ? `Notificaciones (${unread} sin leer)` : "Notificaciones"}
          className="relative"
        >
          <BellIcon className="size-[1.15rem]" />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-background"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] max-w-[calc(100vw-1rem)] p-0">
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markAll()}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheckIcon className="size-3.5" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        <div className="max-h-[22rem] overflow-y-auto border-t border-border/70">
          {query.isLoading && data.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando…</p>
          ) : data.items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <BellIcon className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">Sin notificaciones</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Aquí verás mensajes, visitas y novedades de tus propiedades.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {data.items.map((item) => {
                const isUnread = !item.readAt;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/70",
                        isUnread && "bg-accent-subtle/40",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          isUnread ? "bg-primary" : "bg-transparent",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm",
                            isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/90",
                          )}
                        >
                          {item.title}
                        </span>
                        {item.body && (
                          <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                            {item.body}
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] text-muted-foreground/80">
                          {formatRelativeRd(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-border/70 px-4 py-2.5 text-center">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
