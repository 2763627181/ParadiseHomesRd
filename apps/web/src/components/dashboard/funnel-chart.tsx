import type { FunnelStage } from "@paradise/types";

import { cn } from "@/lib/utils";

/** Embudo simple y accionable: Visitantes → Vistas → Leads → Calificados → Visitas → Reservas → Cierres. */
export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const width = Math.max(4, (stage.value / max) * 100);
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-sm text-muted-foreground">{stage.label}</span>
            <div className="relative h-9 flex-1 overflow-hidden rounded-lg bg-secondary">
              <div
                className={cn(
                  "flex h-full items-center rounded-lg px-3 text-sm font-medium text-primary-foreground transition-all",
                  i === 0 ? "bg-primary" : i < 3 ? "bg-primary/85" : "bg-primary/70",
                )}
                style={{ width: `${width}%` }}
              >
                {stage.value.toLocaleString("es-DO")}
              </div>
            </div>
            <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
              {stage.conversionRate != null ? `${(stage.conversionRate * 100).toFixed(1)}%` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
