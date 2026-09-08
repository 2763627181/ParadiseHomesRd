import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────────────────────────────────────────
 * Capa de datos de notificaciones in-app (`notifications`). Las filas las crea
 * `lib/notify.ts` con el cliente admin; aquí solo LEEMOS con el cliente server
 * (cookies + RLS `notifications_own`), así que cada usuario ve únicamente las
 * suyas. El filtro explícito por `user_id` es una segunda capa de defensa.
 * ───────────────────────────────────────────────────────────────────────────── */

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  /** deep-link relativo (`payload.href`), validado; `null` si no hay */
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

const NOTIFICATION_SELECT = "id, type, title, body, payload, read_at, created_at";

/** Solo aceptamos rutas internas (`/algo`), nunca URLs absolutas ni `//host`. */
function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}

export function mapNotification(row: any): NotificationRow {
  const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<
    string,
    unknown
  >;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body ?? null,
    payload,
    href: safeHref(payload.href),
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

export async function getNotificationsForUser(
  userId: string,
  { limit = 30 }: { limit?: number } = {},
): Promise<NotificationRow[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select(NOTIFICATION_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 200)));

  if (error) {
    console.error("[getNotificationsForUser]", error.message);
    return [];
  }

  return (data ?? []).map(mapNotification);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    console.error("[getUnreadCount]", error.message);
    return 0;
  }

  return count ?? 0;
}
