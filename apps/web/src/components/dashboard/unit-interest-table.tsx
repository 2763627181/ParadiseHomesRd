import Link from "next/link";
import { formatRelativeRd } from "@paradise/utils/datetime";

import type { UnitInterestRow } from "@/lib/data/unit-interest";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Disponible",
  RESERVED: "Reservada",
  SOLD: "Vendida",
  BLOCKED: "Bloqueada",
};

export function UnitInterestTable({ rows }: { rows: UnitInterestRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">
        Todavía nadie ha marcado interés por una unidad específica.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Unidad</th>
            <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="px-4 py-2.5 text-right font-medium">Interesados</th>
            <th className="px-4 py-2.5 text-right font-medium">Último</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((r) => (
            <tr key={r.unitId} className="hover:bg-secondary/30">
              <td className="px-4 py-3 font-medium">
                {r.unitLabel} <span className="text-xs text-muted-foreground">{r.unitCode}</span>
              </td>
              <td className="px-4 py-3">
                <Link href={`/project/${r.projectSlug}`} className="hover:underline">
                  {r.projectName}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant={r.unitStatus === "AVAILABLE" ? "success" : "secondary"}>
                  {STATUS_LABEL[r.unitStatus] ?? r.unitStatus}
                </Badge>
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{r.leads}</td>
              <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                {formatRelativeRd(r.lastLeadAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
