import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────────────────────────────────────────
 * Analítica avanzada. Lee `analytics_events` (fuente de verdad del funnel) +
 * `leads` / `closings` / `visits`, filtra por ventana temporal y ámbito
 * (toda la plataforma, un asesor, una inmobiliaria o una desarrolladora), y
 * agrega en memoria (PostgREST no hace GROUP BY cómodo).
 * ───────────────────────────────────────────────────────────────────────────── */

export type AnalyticsScope =
  | { kind: "admin" }
  | { kind: "agent"; agentId: string }
  | { kind: "agency"; agencyId: string }
  | { kind: "developer"; developerId: string };

export interface ActivityPoint {
  date: string; // YYYY-MM-DD
  views: number;
  leads: number;
  closings: number;
}

export interface FunnelRow {
  key: string;
  label: string;
  value: number;
  conversionRate: number | null;
}

export interface SourceRow {
  source: string;
  label: string;
  leads: number;
  qualified: number;
  closings: number;
}

export interface RankedProperty {
  id: string;
  title: string;
  slug: string;
  views: number;
  leads: number;
}

export interface RankedAgent {
  id: string;
  name: string;
  slug: string;
  leads: number;
  closings: number;
  volume: number;
}

export interface AnalyticsSummary {
  rangeDays: number;
  totals: { views: number; leads: number; qualified: number; visits: number; closings: number; volumeUsd: number };
  activity: ActivityPoint[];
  funnel: FunnelRow[];
  sources: SourceRow[];
  topProperties: RankedProperty[];
  /** solo admin / agencia */
  topAgents: RankedAgent[];
  /** solo admin: canales de tráfico (utm_source) */
  traffic: { source: string; events: number }[];
}

const SOURCE_LABELS: Record<string, string> = {
  direct: "Directo",
  organic: "Búsqueda orgánica",
  paid_search: "Búsqueda pagada",
  paid_social: "Social pagado",
  social: "Social orgánico",
  referral: "Referido",
  email: "Email",
  whatsapp: "WhatsApp",
  portal: "Portal",
  agent_share: "Compartido por asesor",
};

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}
function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function scopeCol(scope: AnalyticsScope): { col: string; val: string } | null {
  if (scope.kind === "agent") return { col: "agent_id", val: scope.agentId };
  if (scope.kind === "agency") return { col: "agency_id", val: scope.agencyId };
  if (scope.kind === "developer") return { col: "developer_id", val: scope.developerId };
  return null;
}

export async function getAnalytics(scope: AnalyticsScope, rangeDays = 30): Promise<AnalyticsSummary | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;
  const since = daysAgoISO(rangeDays);
  const sc = scopeCol(scope);

  // ── eventos de analítica ──────────────────────────────────────────────────
  let evq = admin
    .from("analytics_events")
    .select("name, property_id, agent_id, agency_id, session_id, utm_source, occurred_at")
    .gte("occurred_at", since)
    .limit(50000);
  // analytics_events no tiene developer_id; para desarrolladora filtramos vía propiedades luego.
  if (sc && scope.kind !== "developer") evq = evq.eq(sc.col, sc.val);

  // ── leads ────────────────────────────────────────────────────────────────
  let lq = admin
    .from("leads")
    .select("id, status, source, agent_id, agency_id, developer_id, property_id, created_at, qualified_at")
    .gte("created_at", since)
    .limit(20000);
  if (sc) lq = lq.eq(sc.col, sc.val);

  // ── closings ─────────────────────────────────────────────────────────────
  let cq = admin
    .from("closings")
    .select("id, closing_amount, currency, agent_id, agency_id, developer_id, closed_at")
    .gte("closed_at", dayKey(since))
    .limit(10000);
  if (sc) cq = cq.eq(sc.col, sc.val);

  // ── visits ───────────────────────────────────────────────────────────────
  let vq = admin
    .from("visits")
    .select("id, created_at, lead:leads!inner(agent_id, agency_id, developer_id)")
    .gte("created_at", since)
    .limit(10000);
  if (sc) vq = vq.eq(`leads.${sc.col}`, sc.val);

  const [ev, leads, closings, visits] = await Promise.all([evq, lq, cq, vq]);
  if (ev.error) console.error("[getAnalytics:events]", ev.error.message);
  if (leads.error) console.error("[getAnalytics:leads]", leads.error.message);
  if (closings.error) console.error("[getAnalytics:closings]", closings.error.message);
  if (visits.error) console.error("[getAnalytics:visits]", visits.error.message);

  const events = (ev.data ?? []) as any[];
  const leadRows = (leads.data ?? []) as any[];
  const closingRows = (closings.data ?? []) as any[];
  const visitRows = (visits.data ?? []) as any[];

  // Para desarrolladora, acota los eventos a las propiedades de sus proyectos.
  let devPropertyIds: Set<string> | null = null;
  if (scope.kind === "developer") {
    const { data: props } = await admin
      .from("properties")
      .select("id, project:projects!inner(developer_id)")
      .eq("projects.developer_id", scope.developerId)
      .limit(5000);
    devPropertyIds = new Set((props ?? []).map((p: any) => p.id as string));
  }
  const scopedEvents = devPropertyIds
    ? events.filter((e) => e.property_id && devPropertyIds!.has(e.property_id))
    : events;

  // ── serie temporal ───────────────────────────────────────────────────────
  const byDay = new Map<string, ActivityPoint>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = dayKey(daysAgoISO(i));
    byDay.set(d, { date: d, views: 0, leads: 0, closings: 0 });
  }
  for (const e of scopedEvents) {
    if (e.name !== "property_view") continue;
    const p = byDay.get(dayKey(e.occurred_at));
    if (p) p.views++;
  }
  for (const l of leadRows) {
    const p = byDay.get(dayKey(l.created_at));
    if (p) p.leads++;
  }
  for (const c of closingRows) {
    const p = byDay.get(c.closed_at?.slice(0, 10));
    if (p) p.closings++;
  }
  const activity = [...byDay.values()];

  // ── totales + funnel ─────────────────────────────────────────────────────
  const views = scopedEvents.filter((e) => e.name === "property_view").length;
  const visitors = new Set(scopedEvents.map((e) => e.session_id).filter(Boolean)).size;
  const totalLeads = leadRows.length;
  const qualified = leadRows.filter((l) => l.qualified_at || ["QUALIFIED", "VISIT_SCHEDULED", "VISIT_COMPLETED", "NEGOTIATING", "RESERVED", "CLOSED_WON"].includes(l.status)).length;
  const totalVisits = visitRows.length;
  const totalClosings = closingRows.length;
  const volumeUsd = closingRows.reduce(
    (s, c) => s + (c.currency === "USD" ? Number(c.closing_amount) : Math.round(Number(c.closing_amount) / 59)),
    0,
  );

  const rawFunnel: { key: string; label: string; value: number }[] = [
    { key: "visitors", label: "Visitantes", value: visitors },
    { key: "views", label: "Vistas de propiedad", value: views },
    { key: "leads", label: "Leads", value: totalLeads },
    { key: "qualified", label: "Calificados", value: qualified },
    { key: "visits", label: "Visitas", value: totalVisits },
    { key: "closings", label: "Cierres", value: totalClosings },
  ];
  const funnel: FunnelRow[] = rawFunnel.map((s, i) => ({
    ...s,
    conversionRate: i === 0 ? null : rawFunnel[i - 1]!.value > 0 ? s.value / rawFunnel[i - 1]!.value : null,
  }));

  // ── leads por fuente ─────────────────────────────────────────────────────
  const sourceMap = new Map<string, SourceRow>();
  for (const l of leadRows) {
    const key = l.source || "direct";
    const row = sourceMap.get(key) ?? { source: key, label: SOURCE_LABELS[key] ?? key, leads: 0, qualified: 0, closings: 0 };
    row.leads++;
    if (["QUALIFIED", "VISIT_SCHEDULED", "VISIT_COMPLETED", "NEGOTIATING", "RESERVED", "CLOSED_WON"].includes(l.status)) row.qualified++;
    if (l.status === "CLOSED_WON") row.closings++;
    sourceMap.set(key, row);
  }
  const sources = [...sourceMap.values()].sort((a, b) => b.leads - a.leads);

  // ── top propiedades ──────────────────────────────────────────────────────
  const propViews = new Map<string, number>();
  for (const e of scopedEvents) {
    if (e.name === "property_view" && e.property_id) propViews.set(e.property_id, (propViews.get(e.property_id) ?? 0) + 1);
  }
  const propLeads = new Map<string, number>();
  for (const l of leadRows) {
    if (l.property_id) propLeads.set(l.property_id, (propLeads.get(l.property_id) ?? 0) + 1);
  }
  const topIds = [...new Set([...propViews.keys(), ...propLeads.keys()])]
    .sort((a, b) => (propViews.get(b) ?? 0) + (propLeads.get(b) ?? 0) * 5 - ((propViews.get(a) ?? 0) + (propLeads.get(a) ?? 0) * 5))
    .slice(0, 10);
  let topProperties: RankedProperty[] = [];
  if (topIds.length) {
    const { data: props } = await admin.from("properties").select("id, title, slug").in("id", topIds);
    const meta = new Map((props ?? []).map((p: any) => [p.id, p]));
    topProperties = topIds
      .map((id) => {
        const m = meta.get(id);
        return m ? { id, title: m.title, slug: m.slug, views: propViews.get(id) ?? 0, leads: propLeads.get(id) ?? 0 } : null;
      })
      .filter((x): x is RankedProperty => x !== null);
  }

  // ── top asesores (admin / agencia) ───────────────────────────────────────
  let topAgents: RankedAgent[] = [];
  if (scope.kind === "admin" || scope.kind === "agency") {
    const agentLeads = new Map<string, number>();
    for (const l of leadRows) if (l.agent_id) agentLeads.set(l.agent_id, (agentLeads.get(l.agent_id) ?? 0) + 1);
    const agentClose = new Map<string, { n: number; vol: number }>();
    for (const c of closingRows) {
      if (!c.agent_id) continue;
      const cur = agentClose.get(c.agent_id) ?? { n: 0, vol: 0 };
      cur.n++;
      cur.vol += c.currency === "USD" ? Number(c.closing_amount) : Math.round(Number(c.closing_amount) / 59);
      agentClose.set(c.agent_id, cur);
    }
    const ids = [...new Set([...agentLeads.keys(), ...agentClose.keys()])].slice(0, 20);
    if (ids.length) {
      const { data: agents } = await admin.from("agents").select("id, full_name, slug").in("id", ids);
      const meta = new Map((agents ?? []).map((a: any) => [a.id, a]));
      topAgents = ids
        .map((id) => {
          const m = meta.get(id);
          const cl = agentClose.get(id) ?? { n: 0, vol: 0 };
          return m ? { id, name: m.full_name, slug: m.slug, leads: agentLeads.get(id) ?? 0, closings: cl.n, volume: cl.vol } : null;
        })
        .filter((x): x is RankedAgent => x !== null)
        .sort((a, b) => b.closings - a.closings || b.leads - a.leads);
    }
  }

  // ── canales de tráfico (solo admin) ──────────────────────────────────────
  let traffic: { source: string; events: number }[] = [];
  if (scope.kind === "admin") {
    const tm = new Map<string, number>();
    for (const e of scopedEvents) {
      const s = e.utm_source || "directo";
      tm.set(s, (tm.get(s) ?? 0) + 1);
    }
    traffic = [...tm.entries()].map(([source, events]) => ({ source, events })).sort((a, b) => b.events - a.events).slice(0, 10);
  }

  return {
    rangeDays,
    totals: { views, leads: totalLeads, qualified, visits: totalVisits, closings: totalClosings, volumeUsd },
    activity,
    funnel,
    sources,
    topProperties,
    topAgents,
    traffic,
  };
}
