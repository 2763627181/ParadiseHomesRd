import "server-only";

import { demoAgents, demoProjects, demoProperties } from "@paradise/database";
import { LEAD_PIPELINE_ORDER, type LeadStatus } from "@paradise/config";
import type { AdminOverview, AgentOverview, StatCard } from "@paradise/types";

import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/* ─────────────────────────────────────────────────────────────────────────────
 * Modo demo: se derivan métricas plausibles de los datos demo (view_count,
 * favorite_count, lead_count) para que los paneles no se vean vacíos.
 * Con Supabase configurado se consultan `analytics_events` y `leads` reales.
 * ───────────────────────────────────────────────────────────────────────────── */

function seededPipeline(totalLeads: number): Partial<Record<LeadStatus, number>> {
  const weights = [0.34, 0.24, 0.16, 0.1, 0.07, 0.05, 0.04];
  const out: Partial<Record<LeadStatus, number>> = {};
  LEAD_PIPELINE_ORDER.forEach((status, i) => {
    out[status] = Math.max(0, Math.round(totalLeads * (weights[i] ?? 0.02)));
  });
  return out;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (isSupabaseConfigured) {
    const real = await sbAdminOverview();
    if (real) return real;
  }
  return demoAdminOverview();
}

function demoAdminOverview(): AdminOverview {
  const totalViews = demoProperties.reduce((n, p) => n + p.viewCount, 0);
  const totalFavorites = demoProperties.reduce((n, p) => n + p.favoriteCount, 0);
  const leads = Math.round(totalViews * 0.032);
  const qualified = Math.round(leads * 0.42);
  const visits = Math.round(qualified * 0.55);
  const reservations = Math.round(visits * 0.28);
  const closings = Math.round(reservations * 0.6);
  const visitors = Math.round(totalViews * 1.9);

  const stats: StatCard[] = [
    { key: "properties", label: "Propiedades activas", value: demoProperties.length },
    { key: "projects", label: "Proyectos", value: demoProjects.length },
    { key: "agents", label: "Agentes", value: demoAgents.length },
    { key: "visitors", label: "Visitantes (30d)", value: visitors, deltaPct: 12 },
    { key: "leads", label: "Leads (30d)", value: leads, deltaPct: 8 },
    { key: "qualified", label: "Leads calificados", value: qualified },
    { key: "visits", label: "Visitas", value: visits },
    { key: "reservations", label: "Reservas", value: reservations },
    { key: "closings", label: "Cierres", value: closings },
    {
      key: "conversion",
      label: "Conversión lead→cierre",
      value: leads ? Number(((closings / leads) * 100).toFixed(1)) : 0,
      format: "percent",
    },
  ];

  const funnelValues = [
    { key: "visitors", label: "Visitantes", value: visitors },
    { key: "views", label: "Vistas de propiedad", value: totalViews },
    { key: "leads", label: "Leads", value: leads },
    { key: "qualified", label: "Leads calificados", value: qualified },
    { key: "visits", label: "Visitas", value: visits },
    { key: "reservations", label: "Reservas", value: reservations },
    { key: "closings", label: "Cierres", value: closings },
  ];

  return {
    stats,
    funnel: funnelValues.map((stage, i) => ({
      ...stage,
      conversionRate: i === 0 ? null : stage.value / (funnelValues[i - 1]?.value || 1),
    })),
    leadsBySource: [
      { source: "meta_ads", label: "Meta Ads", leads: Math.round(leads * 0.34), qualified: Math.round(qualified * 0.3), closings: Math.round(closings * 0.28) },
      { source: "instagram", label: "Instagram", leads: Math.round(leads * 0.19), qualified: Math.round(qualified * 0.2), closings: Math.round(closings * 0.18) },
      { source: "google", label: "Google", leads: Math.round(leads * 0.17), qualified: Math.round(qualified * 0.22), closings: Math.round(closings * 0.26) },
      { source: "organic", label: "Orgánico", leads: Math.round(leads * 0.15), qualified: Math.round(qualified * 0.16), closings: Math.round(closings * 0.16) },
      { source: "tiktok", label: "TikTok", leads: Math.round(leads * 0.09), qualified: Math.round(qualified * 0.07), closings: Math.round(closings * 0.06) },
      { source: "referral", label: "Referidos", leads: Math.round(leads * 0.06), qualified: Math.round(qualified * 0.05), closings: Math.round(closings * 0.06) },
    ],
    leadsTimeseries: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86_400_000).toISOString().slice(0, 10),
      value: Math.round((leads / 30) * (0.6 + Math.sin(i / 3) * 0.35 + Math.random() * 0.2)),
    })),
    topProjects: demoProjects
      .map((p, i) => ({ id: p.id, name: p.name, leads: Math.round(leads * (0.18 - i * 0.03)) }))
      .filter((p) => p.leads > 0),
    pendingVerifications: 3,
    pendingModeration: 5,
  };
}

async function sbAdminOverview(): Promise<AdminOverview | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  try {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [{ count: properties }, { count: projects }, { count: agents }, { count: leads }] =
      await Promise.all([
        supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "PUBLISHED"),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("agents").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", since),
      ]);

    const { data: events } = await supabase
      .from("analytics_events")
      .select("name")
      .gte("occurred_at", since)
      .limit(50000);
    const counts = (events ?? []).reduce<Record<string, number>>((acc, e: { name: string }) => {
      acc[e.name] = (acc[e.name] ?? 0) + 1;
      return acc;
    }, {});

    const visitors = counts.page_view ?? 0;
    const views = counts.property_view ?? 0;
    const leadCount = leads ?? counts.lead_created ?? 0;
    const visits = counts.visit_completed ?? 0;
    const reservations = counts.reservation_created ?? 0;
    const closings = counts.closing_created ?? 0;

    const funnel = [
      { key: "visitors", label: "Visitantes", value: visitors },
      { key: "views", label: "Vistas de propiedad", value: views },
      { key: "leads", label: "Leads", value: leadCount },
      { key: "qualified", label: "Leads calificados", value: Math.round(leadCount * 0.4) },
      { key: "visits", label: "Visitas", value: visits },
      { key: "reservations", label: "Reservas", value: reservations },
      { key: "closings", label: "Cierres", value: closings },
    ];

    return {
      stats: [
        { key: "properties", label: "Propiedades activas", value: properties ?? 0 },
        { key: "projects", label: "Proyectos", value: projects ?? 0 },
        { key: "agents", label: "Agentes", value: agents ?? 0 },
        { key: "visitors", label: "Visitantes (30d)", value: visitors },
        { key: "leads", label: "Leads (30d)", value: leadCount },
      ],
      funnel: funnel.map((s, i) => ({
        ...s,
        conversionRate: i === 0 ? null : s.value / (funnel[i - 1]?.value || 1),
      })),
      leadsBySource: [],
      leadsTimeseries: [],
      topProjects: [],
      pendingVerifications: 0,
      pendingModeration: 0,
    };
  } catch (error) {
    console.error("[sbAdminOverview]", error);
    return null;
  }
}

export async function getAgentOverview(agentId: string | null): Promise<AgentOverview> {
  const agent = demoAgents.find((a) => a.id === agentId) ?? demoAgents[0]!;
  const listings = demoProperties.filter((p) => p.agent?.id === agent.id);
  const totalViews = listings.reduce((n, p) => n + p.viewCount, 0);
  const leads = Math.max(4, Math.round(totalViews * 0.04));
  const pipeline = seededPipeline(leads);

  return {
    stats: [
      { key: "listings", label: "Propiedades activas", value: listings.length },
      { key: "new_leads", label: "Leads nuevos", value: pipeline.NEW ?? 0, deltaPct: 15 },
      { key: "visits", label: "Visitas agendadas", value: pipeline.VISIT_SCHEDULED ?? 0 },
      { key: "closings", label: "Cierres (mes)", value: pipeline.RESERVED ?? 0 },
      {
        key: "response",
        label: "Tasa de respuesta",
        value: 92,
        format: "percent",
        hint: `~${agent.responseTimeMinutes ?? 20} min`,
      },
    ],
    pipeline: LEAD_PIPELINE_ORDER.map((status) => ({
      status,
      label: status,
      count: pipeline[status] ?? 0,
    })),
    recentLeads: listings.slice(0, 5).map((p, i) => ({
      id: `demo-lead-${i}`,
      leadCode: `PH-L-${String(100 + i).padStart(6, "0")}`,
      contactName: ["Ana", "Luis", "María", "Pedro", "Sofía"][i] ?? "Cliente",
      propertyTitle: p.title,
      status: (["NEW", "CONTACTED", "QUALIFIED", "VISIT_SCHEDULED", "NEGOTIATING"] as LeadStatus[])[i] ?? "NEW",
      createdAt: new Date(Date.now() - i * 3600_000 * 6).toISOString(),
    })),
    upcomingVisits: listings.slice(0, 3).map((p, i) => ({
      id: `demo-visit-${i}`,
      clientName: ["Ana Gómez", "Luis Rosario", "María Cruz"][i] ?? "Cliente",
      propertyTitle: p.title,
      scheduledAt: new Date(Date.now() + (i + 1) * 86_400_000).toISOString(),
    })),
  };
}
