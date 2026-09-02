import { BathIcon, BedDoubleIcon, CarIcon, RulerIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buildSpecChips, type SpecInput } from "@paradise/utils/format";

import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  BedDouble: BedDoubleIcon,
  Bath: BathIcon,
  Car: CarIcon,
  Ruler: RulerIcon,
};

interface PropertySpecsProps extends SpecInput {
  className?: string;
  variant?: "chips" | "inline" | "grid";
  iconClassName?: string;
}

export function PropertySpecs({
  className,
  variant = "inline",
  iconClassName,
  ...specs
}: PropertySpecsProps) {
  const chips = buildSpecChips(specs);
  if (chips.length === 0) return null;

  if (variant === "grid") {
    return (
      <dl className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
        {chips.map((chip) => {
          const Icon = ICONS[chip.icon] ?? RulerIcon;
          return (
            <div
              key={chip.key}
              className="flex flex-col gap-1 rounded-lg border border-border/70 bg-card px-3 py-2.5"
            >
              <Icon className={cn("size-4 text-muted-foreground", iconClassName)} />
              <dt className="sr-only">{chip.label}</dt>
              <dd className="text-sm font-medium">
                {chip.value} <span className="text-muted-foreground">{chip.label}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }

  if (variant === "chips") {
    return (
      <ul className={cn("flex flex-wrap gap-1.5", className)}>
        {chips.map((chip) => {
          const Icon = ICONS[chip.icon] ?? RulerIcon;
          return (
            <li
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              <Icon className={cn("size-3.5", iconClassName)} />
              {chip.value} {chip.label}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <p className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground", className)}>
      {chips.map((chip, i) => (
        <span key={chip.key} className="inline-flex items-center gap-1">
          {i > 0 && <span aria-hidden className="mr-1 text-border">·</span>}
          <span className="font-medium text-foreground">{chip.value}</span> {chip.label}
        </span>
      ))}
    </p>
  );
}
