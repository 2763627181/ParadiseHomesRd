"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { PropertySummary } from "@paradise/types";

import { cn } from "@/lib/utils";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";
import { PropertyMap, type MapPoint } from "@/components/map/property-map";

interface SearchResponse {
  items: PropertySummary[];
  total: number;
  mapPoints: MapPoint[];
}

export function MapSearchView({ layout = "split" }: { layout?: "split" | "full" }) {
  const searchParams = useSearchParams();
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const key = React.useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("limit", "60");
    return sp.toString();
  }, [searchParams]);

  const query = useQuery({
    queryKey: ["map-search", key],
    queryFn: async (): Promise<SearchResponse> => {
      const res = await fetch(`/api/properties?${key}`);
      return res.json();
    },
  });

  const items = query.data?.items ?? [];
  const points = query.data?.mapPoints ?? [];
  const active = items.find((p) => p.id === activeId) ?? null;

  const map = (
    <PropertyMap
      points={points}
      activeProperty={active}
      onActiveChange={setActiveId}
      className="rounded-xl border border-border/70"
    />
  );

  if (layout === "full") {
    return <div className="h-[calc(100dvh-8rem)]">{map}</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr] lg:items-start">
      <div
        className={cn(
          "order-2 space-y-4 lg:order-1 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:pr-1",
        )}
      >
        {query.isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <PropertyCardSkeleton key={i} variant="horizontal" />
          ))}
        {items.map((property) => (
          <div
            key={property.id}
            onMouseEnter={() => setActiveId(property.id)}
            onFocus={() => setActiveId(property.id)}
          >
            <PropertyCard property={property} variant="horizontal" />
          </div>
        ))}
        {!query.isLoading && items.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay propiedades en esta zona. Mueve el mapa o ajusta los filtros.
          </p>
        )}
      </div>
      <div className="order-1 h-[46vh] lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100dvh-9rem)]">
        {map}
      </div>
    </div>
  );
}
