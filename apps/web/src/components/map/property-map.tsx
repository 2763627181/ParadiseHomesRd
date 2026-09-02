"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  APIProvider,
  AdvancedMarker,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { SearchIcon } from "lucide-react";
import type { Currency } from "@paradise/config";
import { formatCompactNumber } from "@paradise/utils/currency";
import { boundsChangedSignificantly, boundsFromPoints } from "@paradise/utils/geo";
import type { PropertySummary } from "@paradise/types";

import { env, isMapsConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property/property-card";

export interface MapPoint {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  price: number | null;
  currency: Currency;
}

const RD_CENTER = { lat: 18.9, lng: -70.16 };

export function PropertyMap({
  points,
  activeProperty,
  onActiveChange,
  className,
}: {
  points: MapPoint[];
  activeProperty?: PropertySummary | null;
  onActiveChange?: (id: string | null) => void;
  className?: string;
}) {
  if (!isMapsConfigured) {
    return <MapFallback count={points.length} className={className} />;
  }

  return (
    <APIProvider apiKey={env.GOOGLE_MAPS_KEY!} libraries={["marker"]}>
      <div className={cn("relative h-full w-full", className)}>
        <Map
          mapId={env.GOOGLE_MAPS_MAP_ID ?? "DEMO_MAP_ID"}
          defaultCenter={RD_CENTER}
          defaultZoom={points.length ? 9 : 8}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          className="h-full w-full"
        >
          <MapContent points={points} onActiveChange={onActiveChange} />
        </Map>
        {activeProperty && (
          <div className="absolute inset-x-3 bottom-3 z-10 sm:left-3 sm:right-auto sm:w-72">
            <PropertyCard property={activeProperty} variant="map" />
          </div>
        )}
      </div>
    </APIProvider>
  );
}

function MapContent({
  points,
  onActiveChange,
}: {
  points: MapPoint[];
  onActiveChange?: (id: string | null) => void;
}) {
  const map = useMap();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSearchArea, setShowSearchArea] = React.useState(false);
  const lastBoundsRef = React.useRef<google.maps.LatLngBoundsLiteral | null>(null);

  React.useEffect(() => {
    if (!map || points.length === 0) return;
    const b = boundsFromPoints(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));
    if (b) {
      map.fitBounds(
        { north: b.north, south: b.south, east: b.east, west: b.west },
        64,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points.length]);

  React.useEffect(() => {
    if (!map) return;
    const listener = map.addListener("idle", () => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const literal = { north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() };
      const prev = lastBoundsRef.current;
      if (
        prev &&
        boundsChangedSignificantly(
          { north: prev.north, south: prev.south, east: prev.east, west: prev.west },
          literal,
        )
      ) {
        setShowSearchArea(true);
      }
      lastBoundsRef.current = literal;
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  const searchThisArea = () => {
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("north", ne.lat().toFixed(5));
    sp.set("south", sw.lat().toFixed(5));
    sp.set("east", ne.lng().toFixed(5));
    sp.set("west", sw.lng().toFixed(5));
    router.replace(`?${sp.toString()}`, { scroll: false });
    setShowSearchArea(false);
  };

  return (
    <>
      {points.map((point) => (
        <AdvancedMarker
          key={point.id}
          position={{ lat: point.latitude, lng: point.longitude }}
          onClick={() => onActiveChange?.(point.id)}
        >
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-semibold text-foreground shadow-md">
            {point.price ? `${point.currency === "USD" ? "$" : "RD$"}${formatCompactNumber(point.price)}` : "—"}
          </span>
        </AdvancedMarker>
      ))}

      {showSearchArea && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
          <Button size="sm" onClick={searchThisArea} className="shadow-lg">
            <SearchIcon className="size-4" />
            Buscar en esta zona
          </Button>
        </div>
      )}
    </>
  );
}

function MapFallback({ count, className }: { count: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary bg-grid p-8 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium">Mapa no disponible</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Configura <code className="rounded bg-background px-1">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> para
        ver las {count} propiedades sobre el mapa.
      </p>
    </div>
  );
}
