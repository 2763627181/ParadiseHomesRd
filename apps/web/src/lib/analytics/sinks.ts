import type { AnalyticsEvent, AnalyticsSink } from "@paradise/utils/analytics";

import { env } from "@/lib/env";

type AnyFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: AnyFn;
    fbq?: AnyFn;
    ttq?: { track: (name: string, props?: Record<string, unknown>) => void };
    posthog?: { capture: (name: string, props?: Record<string, unknown>) => void };
  }
}

/** Persiste el evento en Supabase vía route handler (no bloquea la UI). */
export const supabaseSink: AnalyticsSink = {
  name: "supabase",
  track(event) {
    if (typeof navigator === "undefined") return;
    const body = JSON.stringify(serialize(event));
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/events", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
      }
    } catch {
      /* noop */
    }
  },
};

export const ga4Sink: AnalyticsSink = {
  name: "ga4",
  track(event) {
    window.gtag?.("event", event.name, {
      ...flatten(event),
    });
  },
  identify(userId) {
    if (env.GA_ID) window.gtag?.("config", env.GA_ID, { user_id: userId });
  },
};

const META_EVENT_MAP: Record<string, string> = {
  property_view: "ViewContent",
  lead_created: "Lead",
  favorite_added: "AddToWishlist",
  search: "Search",
  visit_requested: "Schedule",
};

export const metaPixelSink: AnalyticsSink = {
  name: "meta",
  track(event) {
    const mapped = META_EVENT_MAP[event.name];
    if (mapped) window.fbq?.("track", mapped, flatten(event));
    else window.fbq?.("trackCustom", event.name, flatten(event));
  },
};

const TIKTOK_EVENT_MAP: Record<string, string> = {
  property_view: "ViewContent",
  lead_created: "SubmitForm",
  favorite_added: "AddToWishlist",
  search: "Search",
};

export const tiktokPixelSink: AnalyticsSink = {
  name: "tiktok",
  track(event) {
    const mapped = TIKTOK_EVENT_MAP[event.name] ?? event.name;
    window.ttq?.track(mapped, flatten(event));
  },
};

export const posthogSink: AnalyticsSink = {
  name: "posthog",
  track(event) {
    window.posthog?.capture(event.name, flatten(event));
  },
  identify(userId, traits) {
    (window.posthog as unknown as { identify?: (id: string, t?: unknown) => void })?.identify?.(
      userId,
      traits,
    );
  },
};

function flatten(event: AnalyticsEvent): Record<string, unknown> {
  return {
    property_id: event.propertyId,
    project_id: event.projectId,
    lead_id: event.leadId,
    agent_id: event.agentId,
    agency_id: event.agencyId,
    path: event.context.path,
    ...event.props,
  };
}

function serialize(event: AnalyticsEvent) {
  return {
    name: event.name,
    session_id: event.context.sessionId ?? null,
    user_id: event.context.userId ?? null,
    property_id: event.propertyId ?? null,
    project_id: event.projectId ?? null,
    lead_id: event.leadId ?? null,
    agent_id: event.agentId ?? null,
    agency_id: event.agencyId ?? null,
    path: event.context.path ?? null,
    props: event.props ?? {},
    occurred_at: event.occurredAt,
  };
}
