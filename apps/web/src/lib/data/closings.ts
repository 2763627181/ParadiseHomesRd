import "server-only";

import type { CommissionStatus } from "@paradise/config";
import type { StatCard } from "@paradise/types";
import { formatPrice, type CurrencyCode } from "@paradise/utils/currency";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * Cierres y comisiones (registro interno). La plataforma NO procesa dinero:
 * `closings` es el libro de ventas/alquileres cerrados y `commissions` la
 * comisión de Paradise que el staff liquida por fuera.
 */

export interface ClosingCommission {
  id: string;
  commissionCode: string;
  amount: number;
  currency: CurrencyCode;
  status: CommissionStatus;
  notes: string | null;
  invoicedAt: string | null;
  paidAt: string | null;
}

export interface ClosingRow {
  id: string;
  closingCode: string;
  closingAmount: number;
  currency: CurrencyCode;
  /** fecha del cierre (YYYY-MM-DD, columna `date`) */
  closedAt: string;
  partnerName: string | null;
  notes: string | null;
  leadId: string | null;
  leadCode: string | null;
  contactName: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  agentId: string | null;
  agentName: string | null;
  agencyName: string | null;
  developerName: string | null;
  /** primera comisión asociada (hoy solo se crea una por cierre) */
  commission: ClosingCommission | null;
  isDemo: boolean;
  createdAt: string;
}

const CLOSING_SELECT = `
  id, closing_code, closing_amount, currency, closed_at, partner_name, notes,
  lead_id, property_id, agent_id, is_demo, created_at,
  lead:leads(lead_code, contact:contacts(full_name)),
  property:properties(title, slug),
  agent:agents(full_name),
  agency:agencies(name),
  developer:developers(name),
  commission:commissions(id, commission_code, amount, currency, status, notes, invoiced_at, paid_at)
`;

/** PostgREST devuelve relaciones uno-a-muchos como array; tomamos la primera. */
function firstOf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapClosing(row: any): ClosingRow {
  const c = firstOf<any>(row.commission);
  return {
    id: row.id,
    closingCode: row.closing_code,
    closingAmount: Number(row.closing_amount),
    currency: row.currency,
    closedAt: row.closed_at,
    partnerName: row.partner_name ?? null,
    notes: row.notes ?? null,
    leadId: row.lead_id ?? null,
    leadCode: row.lead?.lead_code ?? null,
    contactName: row.lead?.contact?.full_name ?? null,
    propertyId: row.property_id ?? null,
    propertyTitle: row.property?.title ?? null,
    propertySlug: row.property?.slug ?? null,
    agentId: row.agent_id ?? null,
    agentName: row.agent?.full_name ?? null,
    agencyName: row.agency?.name ?? null,
    developerName: row.developer?.name ?? null,
    commission: c
      ? {
          id: c.id,
          commissionCode: c.commission_code,
          amount: Number(c.amount),
          currency: c.currency,
          status: c.status,
          notes: c.notes ?? null,
          invoicedAt: c.invoiced_at ?? null,
          paidAt: c.paid_at ?? null,
        }
      : null,
    isDemo: Boolean(row.is_demo),
    createdAt: row.created_at,
  };
}

export type ClosingsScope =
  | { agentId: string }
  | { agencyId: string }
  | { developerId: string }
  | { all: true };

async function queryClosings(scope: ClosingsScope, label: string): Promise<ClosingRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  let q = admin.from("closings").select(CLOSING_SELECT);
  if ("agentId" in scope) q = q.eq("agent_id", scope.agentId);
  else if ("agencyId" in scope) q = q.eq("agency_id", scope.agencyId);
  else if ("developerId" in scope) q = q.eq("developer_id", scope.developerId);

  const { data, error } = await q
    .order("closed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error(`[${label}]`, error.message);
    return [];
  }
  return (data ?? []).map(mapClosing);
}

export function getClosingsForAgent(agentId: string): Promise<ClosingRow[]> {
  return queryClosings({ agentId }, "getClosingsForAgent");
}

export function getClosingsForAgency(agencyId: string): Promise<ClosingRow[]> {
  return queryClosings({ agencyId }, "getClosingsForAgency");
}

export function getClosingsForDeveloper(developerId: string): Promise<ClosingRow[]> {
  return queryClosings({ developerId }, "getClosingsForDeveloper");
}

export function getAllClosingsAdmin(): Promise<ClosingRow[]> {
  return queryClosings({ all: true }, "getAllClosingsAdmin");
}

// ── Resumen para stat cards ──────────────────────────────────────────────────

export type CurrencyTotals = Record<CurrencyCode, number>;

export interface ClosingsSummary {
  count: number;
  /** suma de `closing_amount` por moneda */
  volume: CurrencyTotals;
  /** comisiones por estado: cantidad y monto por moneda */
  commissions: Record<CommissionStatus, { count: number; amount: CurrencyTotals }>;
}

const zeroTotals = (): CurrencyTotals => ({ USD: 0, DOP: 0 });

function addTotals(target: CurrencyTotals, currency: CurrencyCode, amount: number) {
  target[currency] = (target[currency] ?? 0) + amount;
}

/** Agrega totales a partir de filas ya cargadas (evita una segunda consulta). */
export function summarizeClosings(rows: ClosingRow[]): ClosingsSummary {
  const summary: ClosingsSummary = {
    count: rows.length,
    volume: zeroTotals(),
    commissions: {
      PENDING: { count: 0, amount: zeroTotals() },
      INVOICED: { count: 0, amount: zeroTotals() },
      PAID: { count: 0, amount: zeroTotals() },
      DISPUTED: { count: 0, amount: zeroTotals() },
      CANCELLED: { count: 0, amount: zeroTotals() },
    },
  };

  for (const row of rows) {
    addTotals(summary.volume, row.currency, row.closingAmount);
    const c = row.commission;
    if (!c) continue;
    const bucket = summary.commissions[c.status];
    if (!bucket) continue;
    bucket.count += 1;
    addTotals(bucket.amount, c.currency, c.amount);
  }

  return summary;
}

export async function getClosingsSummary(scope: ClosingsScope): Promise<ClosingsSummary> {
  return summarizeClosings(await queryClosings(scope, "getClosingsSummary"));
}

function sumTotals(...parts: CurrencyTotals[]): CurrencyTotals {
  const out = zeroTotals();
  for (const p of parts) {
    out.USD += p.USD;
    out.DOP += p.DOP;
  }
  return out;
}

function moneyValue(t: CurrencyTotals): string {
  return formatPrice(t.USD, "USD", { compact: true });
}

function dopHint(t: CurrencyTotals): string | undefined {
  return t.DOP > 0 ? `+ ${formatPrice(t.DOP, "DOP", { compact: true })}` : undefined;
}

/** Tarjetas para `StatGrid` (USD como valor principal; DOP como pista). */
export function closingStatCards(summary: ClosingsSummary): StatCard[] {
  const { commissions: c } = summary;
  const generated = sumTotals(c.PENDING.amount, c.INVOICED.amount, c.PAID.amount, c.DISPUTED.amount);
  const open = sumTotals(c.PENDING.amount, c.INVOICED.amount);
  const openCount = c.PENDING.count + c.INVOICED.count;

  return [
    { key: "closings", label: "Cierres", value: summary.count },
    { key: "volume", label: "Volumen cerrado", value: moneyValue(summary.volume), hint: dopHint(summary.volume) },
    { key: "commission", label: "Comisiones generadas", value: moneyValue(generated), hint: dopHint(generated) },
    {
      key: "commission-open",
      label: "Comisiones por liquidar",
      value: moneyValue(open),
      hint: dopHint(open) ?? (openCount ? `${openCount} pendiente${openCount === 1 ? "" : "s"}` : undefined),
    },
    {
      key: "commission-paid",
      label: "Comisiones pagadas",
      value: moneyValue(c.PAID.amount),
      hint: dopHint(c.PAID.amount) ?? (c.PAID.count ? `${c.PAID.count} liquidada${c.PAID.count === 1 ? "" : "s"}` : undefined),
    },
  ];
}
