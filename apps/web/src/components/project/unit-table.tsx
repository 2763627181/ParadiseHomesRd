"use client";

import * as React from "react";
import { UNIT_STATUS, type UnitStatus } from "@paradise/config";
import { formatArea } from "@paradise/utils/format";
import { formatPrice } from "@paradise/utils/currency";
import type { ProjectUnit } from "@paradise/types";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_META: Record<UnitStatus, { label: string; variant: "success" | "warning" | "secondary" | "outline" }> = {
  [UNIT_STATUS.AVAILABLE]: { label: "Disponible", variant: "success" },
  [UNIT_STATUS.RESERVED]: { label: "Reservada", variant: "warning" },
  [UNIT_STATUS.SOLD]: { label: "Vendida", variant: "secondary" },
  [UNIT_STATUS.BLOCKED]: { label: "Bloqueada", variant: "outline" },
};

export function UnitTable({ units }: { units: ProjectUnit[] }) {
  const [onlyAvailable, setOnlyAvailable] = React.useState(false);
  const [sort, setSort] = React.useState<"price" | "area" | "level">("price");

  const rows = React.useMemo(() => {
    let list = [...units];
    if (onlyAvailable) list = list.filter((u) => u.status === UNIT_STATUS.AVAILABLE);
    list.sort((a, b) => {
      if (sort === "price") return (a.price ?? 0) - (b.price ?? 0);
      if (sort === "area") return (a.areaM2 ?? 0) - (b.areaM2 ?? 0);
      return (a.level ?? 0) - (b.level ?? 0);
    });
    return list;
  }, [units, onlyAvailable, sort]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="size-4 rounded border-input"
          />
          Solo disponibles
        </label>
        <div className="ml-auto flex gap-1 rounded-lg bg-secondary p-1 text-xs">
          {(["price", "area", "level"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium transition-colors",
                sort === s ? "bg-background shadow-xs" : "text-muted-foreground",
              )}
            >
              {s === "price" ? "Precio" : s === "area" ? "m²" : "Nivel"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Unidad</th>
              <th className="px-4 py-2.5 text-left font-medium">Nivel</th>
              <th className="px-4 py-2.5 text-left font-medium">Hab.</th>
              <th className="px-4 py-2.5 text-left font-medium">m²</th>
              <th className="px-4 py-2.5 text-left font-medium">Precio</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((unit) => (
              <tr key={unit.id} className="hover:bg-secondary/40">
                <td className="px-4 py-2.5 font-medium">{unit.label}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{unit.level ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{unit.bedrooms ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{formatArea(unit.areaM2)}</td>
                <td className="px-4 py-2.5 font-medium tabular-nums">
                  {unit.price ? formatPrice(unit.price, unit.currency, { compact: true }) : "A consultar"}
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant={STATUS_META[unit.status].variant}>
                    {STATUS_META[unit.status].label}
                  </Badge>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay unidades con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
