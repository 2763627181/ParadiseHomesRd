import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* Rendimiento de campañas: agrupa `analytics_events` (sesiones, vistas) y
 * `leads` (leads, calificados, cierres) por utm_campaign / utm_source. */

export interface CampaignRow {
  key: string;
  campaign: string;
  source: string;
  medium: string;
  sessions: number;
  propertyViews: number;
  leads: number;
  qualified: number;
  closings: number;
}

export interface MarketingReport {
  rangeDays: number;
  campaigns: CampaignRow[];
  totals: { sessions: number; leads: number; closings: number };
}


const QUALIFIED = ["QUALIFIED", "VISIT_SCHEDULED", "VISIT_COMPLETED", "NEGOTIATING", "RESERVED", "CLOSED_WON"];

export async function getMarketingReport(rangeDays = 30): Promise<MarketingReport | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const since = new Date(Date.now() - rangeDays * 86_400_000).toISOString();

  const [ev, leads] = await Promise.all([
    admin
      .from("analytics_events")
      .select("name, session_id, utm_source, utm_medium, utm_campaign")
      .gte("occurred_at", since)
      .limit(50000),
    admin
      .from("leads")
      .select("status, utm_source, utm_medium, utm_campaign, campaign")
      .gte("created_at", since)
      .limit(20000),
  ]);

  if (ev.error) console.error("[getMarketingReport:events]", ev.error.message);
  if (leads.error) console.error("[getMarketingReport:leads]", leads.error.message);

  const rows = new Map<string, CampaignRow>();
  const seenSessions = new Map<string, Set<string>>();
  const norm = (v: any) => (typeof v === "string" && v.trim() ? v.trim() : "");

  const rowFor = (source: string, medium: string, campaign: string) => {
    const c = campaign || "(sin campaña)";
    const s = source || "directo";
    const m = medium || "—";
    const key = `${c}|${s}|${m}`;
    let r = rows.get(key);
    if (!r) {
      r = { key, campaign: c, source: s, medium: m, sessions: 0, propertyViews: 0, leads: 0, qualified: 0, closings: 0 };
      rows.set(key, r);
      seenSessions.set(key, new Set());
    }
    return r;
  };

  for (const e of (ev.data ?? []) as any[]) {
    const r = rowFor(norm(e.utm_source), norm(e.utm_medium), norm(e.utm_campaign));
    if (e.session_id) {
      const set = seenSessions.get(r.key)!;
      if (!set.has(e.session_id)) {
        set.add(e.session_id);
        r.sessions++;
      }
    }
    if (e.name === "property_view") r.propertyViews++;
  }

  for (const l of (leads.data ?? []) as any[]) {
    const r = rowFor(norm(l.utm_source), norm(l.utm_medium), norm(l.utm_campaign || l.campaign));
    r.leads++;
    if (QUALIFIED.includes(l.status)) r.qualified++;
    if (l.status === "CLOSED_WON") r.closings++;
  }

  const campaigns = [...rows.values()]
    .filter((r) => r.sessions > 0 || r.leads > 0)
    .sort((a, b) => b.leads - a.leads || b.sessions - a.sessions);

  return {
    rangeDays,
    campaigns,
    totals: {
      sessions: campaigns.reduce((s, r) => s + r.sessions, 0),
      leads: campaigns.reduce((s, r) => s + r.leads, 0),
      closings: campaigns.reduce((s, r) => s + r.closings, 0),
    },
  };
}
