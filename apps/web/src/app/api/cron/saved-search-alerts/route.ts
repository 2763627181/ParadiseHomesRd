import { NextResponse, type NextRequest } from "next/server";

import { serverEnv, isSupabaseConfigured, env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { searchProperties } from "@/lib/data/properties";
import { parseSearchParams, serializeSearchParams, summarizeSearchParams } from "@/lib/search-params";
import { notifyUser } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron de alertas de búsquedas guardadas. Vercel lo llama según `vercel.json`.
 * Para cada `saved_searches` con alerta activa y "vencida" según su frecuencia,
 * corre la búsqueda, cuenta las propiedades publicadas desde la última corrida
 * y, si hay novedades, notifica al usuario (in-app + correo) y actualiza
 * `last_run_at`.
 *
 * Autenticación: `Authorization: Bearer $CRON_SECRET`. Vercel Cron manda ese
 * header automáticamente cuando `CRON_SECRET` está en las env vars del proyecto.
 */

const FREQUENCY_MS: Record<string, number> = {
  instant: 60 * 60 * 1000, // como mucho una vez por hora
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

export async function GET(request: NextRequest) {
  const secret = serverEnv.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured) return NextResponse.json({ skipped: "no backend" });

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "no admin client" }, { status: 500 });

  const { data: searches, error } = await admin
    .from("saved_searches")
    .select("id, user_id, name, params, alert_frequency, last_run_at, created_at")
    .neq("alert_frequency", "off")
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  let processed = 0;
  let notified = 0;

  for (const s of (searches ?? []) as any[]) {
    const gap = FREQUENCY_MS[s.alert_frequency] ?? FREQUENCY_MS.daily!;
    const since = s.last_run_at ? new Date(s.last_run_at).getTime() : new Date(s.created_at).getTime();
    if (now - since < gap) continue;
    processed++;

    try {
      const params = parseSearchParams((s.params ?? {}) as Record<string, string | string[]>);
      const result = await searchProperties({ ...params, sort: "recent", limit: 24, cursor: undefined });
      const fresh = result.items.filter(
        (p) => p.publishedAt != null && new Date(p.publishedAt).getTime() > since,
      );

      if (fresh.length > 0) {
        const label = s.name || summarizeSearchParams(params as any);
        const href = `/properties${serializeSearchParams(params as any)}`;
        await notifyUser({
          userId: s.user_id,
          type: "saved_search_alert",
          title: `${fresh.length} propiedad${fresh.length === 1 ? "" : "es"} nueva${fresh.length === 1 ? "" : "s"} en “${label}”`,
          body: fresh
            .slice(0, 3)
            .map((p) => p.title)
            .join(" · "),
          payload: { href, savedSearchId: s.id },
          email: {
            subject: `Novedades en tu búsqueda: ${label}`,
            html: `<p>Encontramos <strong>${fresh.length}</strong> propiedad(es) nueva(s) que coinciden con “${label}”.</p>
                   <ul>${fresh.slice(0, 6).map((p) => `<li>${p.title}</li>`).join("")}</ul>
                   <p><a href="${env.APP_URL}${href}">Verlas en Paradise Homes RD</a></p>`,
          },
        });
        notified++;
      }
    } catch (err) {
      console.error("[saved-search-alerts]", s.id, err);
    }

    await admin.from("saved_searches").update({ last_run_at: new Date().toISOString() }).eq("id", s.id);
  }

  return NextResponse.json({ ok: true, total: searches?.length ?? 0, processed, notified });
}
