"use client";

import dynamic from "next/dynamic";
import type { Currency } from "@paradise/config";
import type { PropertySummary } from "@paradise/types";

export interface MapPoint {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  price: number | null;
  currency: Currency;
}

export interface PropertyMapProps {
  points: MapPoint[];
  activeProperty?: PropertySummary | null;
  onActiveChange?: (id: string | null) => void;
  className?: string;
}

/** Leaflet necesita `window`, así que el mapa real se carga solo en el cliente. */
const PropertyMapInner = dynamic(
  () => import("./property-map-inner").then((m) => m.PropertyMapInner),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" />,
  },
);

export function PropertyMap(props: PropertyMapProps) {
  return <PropertyMapInner {...props} />;
}
