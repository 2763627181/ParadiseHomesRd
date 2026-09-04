import Image from "next/image";
import Link from "next/link";
import { MapPinIcon } from "lucide-react";
import { OPERATION_LABELS, CONDITION_LABELS, ROUTES } from "@paradise/config";
import { formatLocationLabel } from "@paradise/utils/format";
import type { PropertySummary } from "@paradise/types";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/common/favorite-button";
import { CompareButton } from "@/components/common/compare-button";
import { PriceDisplay } from "@/components/common/price-display";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { PropertySpecs } from "@/components/property/property-specs";

export type PropertyCardVariant =
  | "standard"
  | "compact"
  | "horizontal"
  | "mobile"
  | "map"
  | "featured";

interface PropertyCardProps {
  property: PropertySummary;
  variant?: PropertyCardVariant;
  className?: string;
  priority?: boolean;
  /** índice para stagger de aparición */
  index?: number;
}

export function PropertyCard({
  property,
  variant = "standard",
  className,
  priority = false,
}: PropertyCardProps) {
  const href = ROUTES.property(property.slug);
  const location = formatLocationLabel({
    sector: property.location.sector,
    city: property.location.city,
    province: property.location.province,
  });
  const cover = property.coverImage?.url;
  const operationLabel = OPERATION_LABELS[property.operationType];
  const isHorizontal = variant === "horizontal" || variant === "mobile";

  if (variant === "map") {
    return (
      <Link
        href={href}
        className={cn(
          "group flex w-64 gap-3 overflow-hidden rounded-lg bg-card p-2 shadow-float",
          className,
        )}
      >
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {cover && (
            <Image src={cover} alt={property.title} fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          <PriceDisplay price={property.price} compact className="text-sm" />
          <p className="mt-0.5 line-clamp-1 text-xs font-medium">{property.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{location}</p>
          <PropertySpecs
            variant="inline"
            className="mt-1 text-[0.7rem]"
            bedrooms={property.bedrooms}
            bathrooms={property.bathrooms}
            constructionM2={property.constructionM2}
            landM2={property.landM2}
          />
        </div>
      </Link>
    );
  }

  return (
    <article
      className={cn(
        "group relative isolate overflow-hidden rounded-xl border border-border/70 bg-card shadow-xs transition-[box-shadow,transform,border-color] duration-200 ease-[var(--ease-premium)] hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover",
        isHorizontal ? "flex" : "flex flex-col",
        variant === "featured" && "sm:rounded-2xl",
        className,
      )}
    >
      <Link href={href} className="absolute inset-0 z-10" aria-label={property.title}>
        <span className="sr-only">{property.title}</span>
      </Link>

      {/* Imagen */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-muted",
          isHorizontal
            ? "aspect-square w-[38%] max-w-[11rem] sm:w-44"
            : variant === "featured"
              ? "aspect-[16/11]"
              : "aspect-[4/3]",
        )}
      >
        {cover ? (
          <Image
            src={cover}
            alt={property.coverImage?.alt ?? property.title}
            fill
            priority={priority}
            sizes={
              isHorizontal
                ? "180px"
                : variant === "featured"
                  ? "(max-width: 768px) 100vw, 640px"
                  : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            }
            className="object-cover transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <MapPinIcon className="size-6" />
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute inset-x-2.5 top-2.5 z-20 flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {property.isFeatured && variant !== "compact" && (
              <Badge variant="accent" className="shadow-sm">
                Destacado
              </Badge>
            )}
            {property.isNew && (
              <Badge variant="secondary" className="bg-background/85 shadow-sm backdrop-blur">
                Nuevo
              </Badge>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <FavoriteButton
              id={property.id}
              slug={property.slug}
              title={property.title}
              size={isHorizontal || variant === "compact" ? "sm" : "md"}
            />
            {variant !== "compact" && (
              <CompareButton
                id={property.id}
                size={isHorizontal ? "sm" : "md"}
              />
            )}
          </div>
        </div>

        {/* Badges inferiores */}
        <div className="absolute inset-x-2.5 bottom-2.5 z-20 flex items-end justify-between gap-2">
          <Badge
            variant="secondary"
            className="bg-background/85 text-[0.7rem] shadow-sm backdrop-blur"
          >
            {operationLabel}
          </Badge>
          {property.isVerified && <VerifiedBadge iconOnly />}
        </div>
      </div>

      {/* Contenido */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isHorizontal ? "gap-1 p-3.5" : variant === "featured" ? "gap-2 p-5" : "gap-1.5 p-4",
        )}
      >
        <div className="flex items-baseline justify-between gap-2">
          <PriceDisplay
            price={property.price}
            compact={isHorizontal}
            className={cn(variant === "featured" ? "text-xl" : "text-[1.05rem]")}
          />
          {property.conditionStatus && !isHorizontal && variant !== "compact" && (
            <span className="text-xs text-muted-foreground">
              {CONDITION_LABELS[property.conditionStatus]}
            </span>
          )}
        </div>

        <h3
          className={cn(
            "line-clamp-1 font-medium text-foreground",
            variant === "featured" ? "text-base" : "text-sm",
          )}
        >
          {property.title}
        </h3>

        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </p>

        <PropertySpecs
          variant="inline"
          className={cn("mt-auto pt-1", isHorizontal && "text-xs")}
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          parkingSpaces={isHorizontal ? null : property.parkingSpaces}
          constructionM2={property.constructionM2}
          landM2={property.landM2}
        />

        {property.agency && !isHorizontal && variant !== "compact" && (
          <p className="pt-1 text-xs text-muted-foreground">
            {property.agency.name}
            {property.code ? <span className="text-border"> · {property.code}</span> : null}
          </p>
        )}
      </div>
    </article>
  );
}
