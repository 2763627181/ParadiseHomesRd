import { formatPrice } from "@paradise/utils/currency";
import type { PaymentPlan as PaymentPlanType } from "@paradise/types";

const STAGES = [
  { key: "downPaymentPct" as const, label: "Inicial" },
  { key: "duringConstructionPct" as const, label: "Durante construcción" },
  { key: "onDeliveryPct" as const, label: "Contra entrega" },
];

export function PaymentPlan({ plan }: { plan: PaymentPlanType }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{plan.name}</h3>
        {plan.separationAmount?.amount != null && (
          <span className="text-sm text-muted-foreground">
            Separación {formatPrice(plan.separationAmount.amount, plan.separationAmount.currency)}
          </span>
        )}
      </div>

      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-secondary">
        {STAGES.map((stage, i) => {
          const pct = Number(plan[stage.key]);
          return (
            <div
              key={stage.key}
              style={{ width: `${pct}%` }}
              className={i === 0 ? "bg-primary" : i === 1 ? "bg-primary/60" : "bg-accent"}
            />
          );
        })}
      </div>

      <dl className="mt-4 space-y-2">
        {STAGES.map((stage) => (
          <div key={stage.key} className="flex items-center justify-between text-sm">
            <dt className="text-muted-foreground">{stage.label}</dt>
            <dd className="font-medium tabular-nums">{Number(plan[stage.key])}%</dd>
          </div>
        ))}
      </dl>

      {plan.notes && <p className="mt-4 text-xs text-muted-foreground">{plan.notes}</p>}
    </div>
  );
}
