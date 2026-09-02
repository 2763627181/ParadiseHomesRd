import { BadgeCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  className?: string;
  /** solo el ícono, sin texto (para cards compactas / overlays) */
  iconOnly?: boolean;
  label?: string;
  tooltip?: string;
}

/**
 * Sello "Paradise Verified". Se aplica a propiedades, agentes, agencias,
 * desarrolladores y proyectos revisados por el equipo de Paradise.
 */
export function VerifiedBadge({
  className,
  iconOnly = false,
  label = "Paradise Verified",
  tooltip = "Esta publicación ha sido revisada por Paradise Homes: información, disponibilidad y contacto validados.",
}: VerifiedBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {iconOnly ? (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded-full bg-background/85 p-1 text-verified shadow-sm backdrop-blur",
              className,
            )}
            aria-label={label}
          >
            <BadgeCheckIcon className="size-4" />
          </span>
        ) : (
          <Badge variant="verified" className={cn("gap-1", className)}>
            <BadgeCheckIcon className="size-3.5" />
            {label}
          </Badge>
        )}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
