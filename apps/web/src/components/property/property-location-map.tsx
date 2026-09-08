"use client";

import dynamic from "next/dynamic";

export interface PropertyLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  label: string;
  approximate?: boolean;
  zoom?: number;
}

const Inner = dynamic(
  () => import("./property-location-map-inner").then((m) => m.PropertyLocationMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-xl border border-border/70 bg-muted sm:h-[380px]" />
    ),
  },
);

/**
 * Mapa de ubicación del inmueble sobre OpenStreetMap (sin API key). Si la
 * dirección es aproximada se dibuja un área en vez de un punto exacto.
 */
export function PropertyLocationMap({
  latitude,
  longitude,
  label,
  approximate = false,
  zoom = 14,
}: PropertyLocationMapProps) {
  if (latitude == null || longitude == null) return null;
  return (
    <Inner
      latitude={latitude}
      longitude={longitude}
      label={label}
      approximate={approximate}
      zoom={zoom}
    />
  );
}
