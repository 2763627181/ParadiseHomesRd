/**
 * Capa central de analítica: `analytics.track(event, props)`.
 *
 * Un solo punto de entrada distribuye a múltiples destinos (GA4, Meta Pixel,
 * TikTok Pixel, PostHog y la tabla `analytics_events` de Supabase). Cada destino
 * es un "sink" que se registra en runtime. Deduplica por `dedupeKey` opcional.
 */

export type AnalyticsEventName =
  | "page_view"
  | "search"
  | "property_view"
  | "project_view"
  | "favorite_added"
  | "favorite_removed"
  | "share_clicked"
  | "whatsapp_clicked"
  | "phone_clicked"
  | "lead_created"
  | "visit_requested"
  | "visit_completed"
  | "reservation_created"
  | "closing_created";

export interface AnalyticsContext {
  sessionId?: string;
  userId?: string | null;
  path?: string;
}

export interface AnalyticsPayload {
  propertyId?: string;
  projectId?: string;
  unitId?: string;
  leadId?: string;
  agentId?: string;
  agencyId?: string;
  /** propiedades libres del evento */
  props?: Record<string, unknown>;
  /** evita doble-conteo del mismo evento (ej. property_view por sesión) */
  dedupeKey?: string;
}

export interface AnalyticsEvent extends AnalyticsPayload {
  name: AnalyticsEventName;
  context: AnalyticsContext;
  occurredAt: string;
}

export interface AnalyticsSink {
  name: string;
  track: (event: AnalyticsEvent) => void | Promise<void>;
  identify?: (userId: string, traits?: Record<string, unknown>) => void | Promise<void>;
}

export class Analytics {
  private sinks: AnalyticsSink[] = [];
  private seen = new Set<string>();
  private context: AnalyticsContext = {};

  register(sink: AnalyticsSink): void {
    if (!this.sinks.some((s) => s.name === sink.name)) this.sinks.push(sink);
  }

  setContext(context: Partial<AnalyticsContext>): void {
    this.context = { ...this.context, ...context };
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    this.context.userId = userId;
    for (const sink of this.sinks) {
      void sink.identify?.(userId, traits);
    }
  }

  track(name: AnalyticsEventName, payload: AnalyticsPayload = {}): void {
    if (payload.dedupeKey) {
      if (this.seen.has(payload.dedupeKey)) return;
      this.seen.add(payload.dedupeKey);
    }

    const event: AnalyticsEvent = {
      ...payload,
      name,
      context: { ...this.context },
      occurredAt: new Date().toISOString(),
    };

    for (const sink of this.sinks) {
      try {
        void sink.track(event);
      } catch (error) {
        if (typeof console !== "undefined") {
          console.warn(`[analytics] sink "${sink.name}" falló`, error);
        }
      }
    }
  }
}

/** Instancia compartida (por proceso / por cliente). */
export const analytics = new Analytics();
