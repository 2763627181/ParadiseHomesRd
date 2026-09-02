import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { PROJECT_STATUS, ROUTES } from "@paradise/config";
import { formatPriceRange } from "@paradise/utils/currency";
import { formatDateRd } from "@paradise/utils/datetime";
import type { Project, ProjectSummary } from "@paradise/types";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/common/verified-badge";

const STATUS_LABEL: Record<string, string> = {
  [PROJECT_STATUS.PRE_SALE]: "En preventa",
  [PROJECT_STATUS.UNDER_CONSTRUCTION]: "En construcción",
  [PROJECT_STATUS.READY]: "Listo para entrega",
  [PROJECT_STATUS.DELIVERED]: "Entregado",
  [PROJECT_STATUS.SOLD_OUT]: "Vendido",
};

export function ProjectCard({
  project,
  className,
  priority,
}: {
  project: Project | ProjectSummary;
  className?: string;
  priority?: boolean;
}) {
  const cover = project.coverImage?.url;
  const location = [project.location.sector, project.location.city].filter(Boolean).join(", ");

  return (
    <article
      className={cn(
        "group relative isolate flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs transition-[box-shadow,transform] duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
    >
      <Link href={ROUTES.project(project.slug)} className="absolute inset-0 z-10">
        <span className="sr-only">{project.name}</span>
      </Link>

      <div className="relative aspect-[16/11] overflow-hidden bg-muted">
        {cover && (
          <Image
            src={cover}
            alt={project.name}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 420px"
            className="object-cover transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <Badge variant="secondary" className="bg-background/85 shadow-sm backdrop-blur">
            {STATUS_LABEL[project.status] ?? project.status}
          </Badge>
          {project.isVerified && <VerifiedBadge iconOnly />}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10">
          <p className="text-lg font-semibold text-white">{project.name}</p>
          {project.developer && (
            <p className="text-xs text-white/80">{project.developer.name}</p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>
        <p className="text-[0.95rem] font-semibold">
          {formatPriceRange(project.priceFrom.amount, project.priceTo?.amount ?? null, project.priceFrom.currency)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
          {project.bedroomsRange && (
            <span>
              {project.bedroomsRange[0]}–{project.bedroomsRange[1]} habitaciones
            </span>
          )}
          <span>{project.availableUnits} unidades disponibles</span>
          {project.deliveryEstimate && (
            <span className="inline-flex items-center gap-1">
              <CalendarIcon className="size-3.5" />
              Entrega {formatDateRd(project.deliveryEstimate)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
