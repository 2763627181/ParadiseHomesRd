import Link from "next/link";
import type { CommissionStatus } from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";
import { formatDateRd } from "@paradise/utils/datetime";

import type { ClosingRow } from "@/lib/data/closings";
import { Badge } from "@/components/ui/badge";

export const COMMISSION_LABELS: Record<CommissionStatus, string> = {
  PENDING: "Pendiente",
  INVOICED: "Facturada",
  PAID: "Pagada",
  DISPUTED: "En disputa",
  CANCELLED: "Cancelada",
};

export const COMMISSION_VARIANT: Record<
  CommissionStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  PENDING: "warning",
  INVOICED: "secondary",
  PAID: "success",
  DISPUTED: "destructive",
  CANCELLED: "outline",
};

/** Tabla de cierres (solo lectura). `showAgent` añade la columna de asesor. */
export function ClosingsTable({ rows, showAgent = false }: { rows: ClosingRow[]; showAgent?: boolean }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        Aún no hay cierres registrados. Registra uno desde el detalle de un lead ganado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
            <th className="px-4 py-2.5 text-left font-medium">Cierre</th>
            {showAgent && <th className="px-4 py-2.5 text-left font-medium">Asesor</th>}
            <th className="px-4 py-2.5 text-right font-medium">Monto</th>
            <th className="px-4 py-2.5 text-right font-medium">Comisión</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-secondary/30">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateRd(row.closedAt)}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{row.contactName ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {row.closingCode}
                  {row.propertyTitle ? ` · ${row.propertyTitle}` : ""}
                </p>
                {row.leadId && (
                  <Link
                    href={`/agent/dashboard/leads/${row.leadId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver lead
                  </Link>
                )}
              </td>
              {showAgent && (
                <td className="px-4 py-3 text-xs text-muted-foreground">{row.agentName ?? "—"}</td>
              )}
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                {formatPrice(row.closingAmount, row.currency, { compact: true })}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {row.commission ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="tabular-nums">
                      {formatPrice(row.commission.amount, row.commission.currency, { compact: true })}
                    </span>
                    <Badge variant={COMMISSION_VARIANT[row.commission.status]}>
                      {COMMISSION_LABELS[row.commission.status]}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
