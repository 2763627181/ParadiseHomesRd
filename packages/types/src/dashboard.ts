import type { LeadStatus } from "@paradise/config";
import type { ISODateString } from "./common.js";

export interface StatCard {
  key: string;
  label: string;
  value: number | string;
  /** variación vs período anterior, en % */
  deltaPct?: number | null;
  format?: "number" | "currency" | "percent" | "duration";
  hint?: string;
}

export interface TimeseriesPoint {
  date: ISODateString;
  value: number;
}

export interface FunnelStage {
  key: string;
  label: string;
  value: number;
  /** conversión desde la etapa anterior */
  conversionRate: number | null;
}

export interface LeadsBySourceRow {
  source: string;
  label: string;
  leads: number;
  qualified: number;
  closings: number;
}

export interface AgentPerformanceRow {
  agentId: string;
  agentName: string;
  agencyName: string | null;
  activeListings: number;
  newLeads: number;
  responseRatePct: number | null;
  avgResponseMinutes: number | null;
  visitsScheduled: number;
  closings: number;
}

export interface AgencyPerformanceRow {
  agencyId: string;
  agencyName: string;
  leads: number;
  qualifiedRatePct: number | null;
  visits: number;
  closings: number;
  volumeUsd: number;
}

export interface AgentOverview {
  stats: StatCard[];
  pipeline: Array<{ status: LeadStatus; label: string; count: number }>;
  recentLeads: Array<{
    id: string;
    leadCode: string;
    contactName: string;
    propertyTitle: string | null;
    status: LeadStatus;
    createdAt: ISODateString;
  }>;
  upcomingVisits: Array<{
    id: string;
    clientName: string;
    propertyTitle: string | null;
    scheduledAt: ISODateString;
  }>;
}

export interface AdminOverview {
  stats: StatCard[];
  funnel: FunnelStage[];
  leadsBySource: LeadsBySourceRow[];
  leadsTimeseries: TimeseriesPoint[];
  topProjects: Array<{ id: string; name: string; leads: number }>;
  pendingVerifications: number;
  pendingModeration: number;
}
