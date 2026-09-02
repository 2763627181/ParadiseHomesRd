import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react";
import type { StatCard as StatCardType } from "@paradise/types";
import { formatPrice } from "@paradise/utils/currency";

import { cn } from "@/lib/utils";

export function StatCard({ stat }: { stat: StatCardType }) {
  const value =
    stat.format === "currency" && typeof stat.value === "number"
      ? formatPrice(stat.value, "USD", { compact: true })
      : stat.format === "percent" && typeof stat.value === "number"
        ? `${stat.value}%`
        : stat.format === "duration" && typeof stat.value === "number"
          ? `${stat.value} min`
          : typeof stat.value === "number"
            ? stat.value.toLocaleString("es-DO")
            : stat.value;

  const delta = stat.deltaPct;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <p className="text-sm text-muted-foreground">{stat.label}</p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta >= 0 ? "text-success" : "text-destructive",
            )}
          >
            {delta >= 0 ? (
              <ArrowUpRightIcon className="size-3.5" />
            ) : (
              <ArrowDownRightIcon className="size-3.5" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      {stat.hint && <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>}
    </div>
  );
}

export function StatGrid({ stats }: { stats: StatCardType[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <StatCard key={stat.key} stat={stat} />
      ))}
    </div>
  );
}
