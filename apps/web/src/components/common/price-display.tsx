import { formatPrice } from "@paradise/utils/currency";
import type { Money } from "@paradise/types";

import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: Money;
  className?: string;
  compact?: boolean;
  /** mostrar "/mes" en alquiler */
  showPeriod?: boolean;
}

export function PriceDisplay({
  price,
  className,
  compact = false,
  showPeriod = true,
}: PriceDisplayProps) {
  if (price.onRequest || price.amount == null) {
    return <span className={cn("font-semibold", className)}>Precio a consultar</span>;
  }

  const suffix = showPeriod && price.period === "month" ? "/mes" : "";

  return (
    <span className={cn("font-semibold tabular-nums", className)}>
      {formatPrice(price.amount, price.currency, { compact })}
      {suffix && <span className="font-normal text-muted-foreground">{suffix}</span>}
    </span>
  );
}
