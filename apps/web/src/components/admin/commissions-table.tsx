"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { COMMISSION_STATUS, type CommissionStatus } from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";
import { formatDateRd } from "@paradise/utils/datetime";

import { deleteClosing, updateCommissionStatus } from "@/lib/actions/closings";
import type { ClosingRow } from "@/lib/data/closings";
import { COMMISSION_LABELS } from "@/components/dashboard/closings-table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = Object.values(COMMISSION_STATUS) as CommissionStatus[];

export function CommissionsTable({ rows }: { rows: ClosingRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No hay cierres registrados todavía.
      </p>
    );
  }

  const changeStatus = async (commissionId: string, status: CommissionStatus) => {
    setBusyId(commissionId);
    const res = await updateCommissionStatus(commissionId, status);
    setBusyId(null);
    if (res.ok) {
      toast.success("Comisión actualizada");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo actualizar");
    }
  };

  const remove = async (closingId: string) => {
    if (!window.confirm("¿Eliminar este cierre y su comisión? No se puede deshacer.")) return;
    setBusyId(closingId);
    const res = await deleteClosing(closingId);
    setBusyId(null);
    if (res.ok) {
      toast.success("Cierre eliminado");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo eliminar");
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
            <th className="px-4 py-2.5 text-left font-medium">Cierre</th>
            <th className="px-4 py-2.5 text-left font-medium">Origen</th>
            <th className="px-4 py-2.5 text-right font-medium">Monto</th>
            <th className="px-4 py-2.5 text-right font-medium">Comisión</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-secondary/30">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateRd(row.closedAt)}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{row.contactName ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{row.closingCode}</p>
                {row.leadId && (
                  <Link href={`/admin/leads/${row.leadId}`} className="text-xs text-primary hover:underline">
                    Ver lead
                  </Link>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {[row.agentName, row.agencyName, row.developerName].filter(Boolean).join(" · ") || "—"}
                {row.propertyTitle ? <div className="truncate">{row.propertyTitle}</div> : null}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                {formatPrice(row.closingAmount, row.currency, { compact: true })}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                {row.commission
                  ? formatPrice(row.commission.amount, row.commission.currency, { compact: true })
                  : "—"}
              </td>
              <td className="px-4 py-3">
                {row.commission ? (
                  <Select
                    value={row.commission.status}
                    onValueChange={(v) => changeStatus(row.commission!.id, v as CommissionStatus)}
                    disabled={busyId === row.commission.id}
                  >
                    <SelectTrigger size="sm" className="h-8 w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {COMMISSION_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin comisión</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(row.id)}
                  disabled={busyId === row.id}
                  aria-label="Eliminar cierre"
                  className="text-muted-foreground hover:text-destructive"
                >
                  {busyId === row.id ? (
                    <Loader2Icon className="size-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-4" />
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
