"use client";

import { analytics } from "@paradise/utils/analytics";

import { env } from "@/lib/env";
import { ga4Sink, metaPixelSink, posthogSink, supabaseSink, tiktokPixelSink } from "./sinks";

let initialized = false;

/** Registra los sinks disponibles según configuración. Idempotente. */
export function initAnalytics(sessionId: string, userId: string | null): void {
  if (initialized) {
    analytics.setContext({ sessionId, userId });
    return;
  }
  initialized = true;

  analytics.setContext({ sessionId, userId });
  analytics.register(supabaseSink);
  if (env.GA_ID) analytics.register(ga4Sink);
  if (env.META_PIXEL_ID) analytics.register(metaPixelSink);
  if (env.TIKTOK_PIXEL_ID) analytics.register(tiktokPixelSink);
  if (env.POSTHOG_KEY) analytics.register(posthogSink);

  if (process.env.NODE_ENV === "development") {
    analytics.register({
      name: "console",
      track: (event) => console.debug("%c[track]", "color:#163A2B", event.name, event),
    });
  }
}

export { analytics };

/** Session id estable por pestaña. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "ph_session_id";
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}
