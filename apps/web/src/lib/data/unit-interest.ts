import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/server";

/* Unidades de proyecto que han recibido interés (leads con `unit_id`).
 * Acotado por desarrolladora o inmobiliaria dueña de los proyectos. */

export interface UnitInterestRow {
  unitId: string;
  unitLabel: string;
  unitCode: string;
  unitStatus: string;
  projectName: string;
  projectSlug: string;
  leads: number;
  lastLeadAt: string;
}


async function query(column: "developer_id" | "agency_id", orgId: string): Promise<UnitInterestRow[]> {
  const admin = getSupabaseAdminClient();
  if (!admin) return [];

  // proyectos de la organización
  const { data: projects } = await admin
    .from("projects")
    .select("id, name, slug")
    .eq(column, orgId)
    .limit(500);
  const projList = (projects ?? []) as any[];
  if (projList.length === 0) return [];
  const projById = new Map(projList.map((p) => [p.id, p]));

  // leads con unit_id de esos proyectos
  const { data: leads } = await admin
    .from("leads")
    .select("unit_id, project_id, created_at")
    .in("project_id", projList.map((p) => p.id))
    .not("unit_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(5000);

  const agg = new Map<string, { count: number; last: string; projectId: string }>();
  for (const l of (leads ?? []) as any[]) {
    const cur = agg.get(l.unit_id) ?? { count: 0, last: l.created_at, projectId: l.project_id };
    cur.count++;
    if (l.created_at > cur.last) cur.last = l.created_at;
    agg.set(l.unit_id, cur);
  }
  if (agg.size === 0) return [];

  const { data: units } = await admin
    .from("project_units")
    .select("id, label, code, status")
    .in("id", [...agg.keys()]);
  const unitById = new Map((units ?? []).map((u: any) => [u.id, u]));

  return [...agg.entries()]
    .map(([unitId, a]) => {
      const u = unitById.get(unitId);
      const p = projById.get(a.projectId);
      if (!u || !p) return null;
      return {
        unitId,
        unitLabel: u.label,
        unitCode: u.code,
        unitStatus: u.status,
        projectName: p.name,
        projectSlug: p.slug,
        leads: a.count,
        lastLeadAt: a.last,
      };
    })
    .filter((x): x is UnitInterestRow => x !== null)
    .sort((a, b) => b.leads - a.leads || b.lastLeadAt.localeCompare(a.lastLeadAt));
}

export function getUnitInterestForDeveloper(developerId: string): Promise<UnitInterestRow[]> {
  return query("developer_id", developerId);
}
export function getUnitInterestForAgency(agencyId: string): Promise<UnitInterestRow[]> {
  return query("agency_id", agencyId);
}
