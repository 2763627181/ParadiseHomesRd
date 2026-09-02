import { CircleCheckIcon, CircleDashedIcon } from "lucide-react";
import { FRESHNESS_STALE_DAYS } from "@paradise/config";
import { freshnessLabel } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";

export function FreshnessIndicator({
  lastVerifiedAt,
  className,
}: {
  lastVerifiedAt: string | null;
  className?: string;
}) {
  const { label, isStale } = freshnessLabel(lastVerifiedAt, FRESHNESS_STALE_DAYS);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        isStale ? "text-muted-foreground" : "text-verified",
        className,
      )}
    >
      {isStale ? (
        <CircleDashedIcon className="size-3.5" />
      ) : (
        <CircleCheckIcon className="size-3.5" />
      )}
      {label}
    </span>
  );
}
