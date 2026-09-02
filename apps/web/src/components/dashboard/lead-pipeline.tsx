import { LEAD_PIPELINE_ORDER, type LeadStatus } from "@paradise/config";

import { cn } from "@/lib/utils";

const LABELS: Record<LeadStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUALIFIED: "Calificado",
  VISIT_SCHEDULED: "Visita agendada",
  VISIT_COMPLETED: "Visita hecha",
  NEGOTIATING: "Negociando",
  RESERVED: "Reservado",
  CLOSED_WON: "Ganado",
  CLOSED_LOST: "Perdido",
};

export function LeadPipeline({
  counts,
}: {
  counts: Partial<Record<LeadStatus, number>>;
}) {
  const total = LEAD_PIPELINE_ORDER.reduce((n, s) => n + (counts[s] ?? 0), 0);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pipeline de leads</h3>
        <span className="text-xs text-muted-foreground">{total} activos</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {LEAD_PIPELINE_ORDER.map((status, i) => {
          const count = counts[status] ?? 0;
          return (
            <div
              key={status}
              className="min-w-[6.5rem] flex-1 rounded-lg border border-border/70 bg-secondary/40 p-3"
            >
              <p className="text-lg font-semibold tabular-nums">{count}</p>
              <p className={cn("mt-0.5 text-[0.7rem] leading-tight text-muted-foreground")}>
                {LABELS[status]}
              </p>
              <div className="mt-2 h-1 rounded-full bg-primary/15">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${total ? (count / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
