import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getNotificationsForUser, getUnreadCount } from "@/lib/data/notifications";
import { getUnreadMessageCountForProfile } from "@/lib/data/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "private, no-store" };

/**
 * GET /api/notifications?limit=8 → `{ items, unread }` del usuario en sesión.
 * Lo consume la campana del header (polling cada 15 s). 401 sin sesión.
 * Usamos `auth.getUser()` directo en vez de `getSessionUser()` para no cargar
 * perfil + membresías + agente en cada poll.
 */
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ items: [], unread: 0 }, { headers: NO_STORE });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401, headers: NO_STORE });

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 8);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(rawLimit, 50)) : 8;

  const [items, unread, messagesUnread] = await Promise.all([
    getNotificationsForUser(user.id, { limit }),
    getUnreadCount(user.id),
    getUnreadMessageCountForProfile(user.id),
  ]);

  return NextResponse.json({ items, unread, messagesUnread }, { headers: NO_STORE });
}
