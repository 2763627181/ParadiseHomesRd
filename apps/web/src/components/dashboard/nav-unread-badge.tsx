"use client";

import { useQuery } from "@tanstack/react-query";

interface UnreadResponse {
  unread: number;
  messagesUnread?: number;
}

/**
 * Puntito rojo con contador para los ítems "Mensajes" y "Notificaciones" del
 * sidebar. Reusa `/api/notifications` (mismo endpoint que la campana del
 * header). Se oculta solo cuando no hay nada sin leer.
 */
export function NavUnreadBadge({ kind }: { kind: "messages" | "notifications" }) {
  const query = useQuery({
    queryKey: ["notifications", "nav-badge"],
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<UnreadResponse> => {
      const res = await fetch("/api/notifications?limit=1", { cache: "no-store" });
      if (!res.ok) return { unread: 0, messagesUnread: 0 };
      return res.json();
    },
  });

  const count =
    kind === "messages" ? (query.data?.messagesUnread ?? 0) : (query.data?.unread ?? 0);
  if (count <= 0) return null;

  return (
    <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}
