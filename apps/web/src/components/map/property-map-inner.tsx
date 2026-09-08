"use client";

import "leaflet/dist/leaflet.css";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { SearchIcon } from "lucide-react";
import { formatCompactNumber } from "@paradise/utils/currency";
import {
  boundsChangedSignificantly,
  boundsFromPoints,
  type Bounds,
} from "@paradise/utils/geo";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property/property-card";
import type { MapPoint, PropertyMapProps } from "./property-map";

const RD_CENTER: [number, number] = [18.9, -70.16];

const priceLabel = (p: MapPoint) =>
  p.price ? `${p.currency === "USD" ? "$" : "RD$"}${formatCompactNumber(p.price)}` : "—";

function priceIcon(text: string, active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html:
      `<div style="transform:translate(-50%,-50%);white-space:nowrap;">` +
      `<span style="display:inline-block;padding:2px 8px;border-radius:9999px;` +
      `font:600 12px/1.4 system-ui,-apple-system,sans-serif;` +
      `background:${active ? "#0f1512" : "#ffffff"};color:${active ? "#ffffff" : "#0f1512"};` +
      `border:1px solid rgba(0,0,0,.18);box-shadow:0 1px 4px rgba(0,0,0,.28);">${text}</span>` +
      `</div>`,
  });
}

function FitToPoints({ points }: { points: MapPoint[] }) {
  const map = useMap();
  React.useEffect(() => {
    if (points.length === 0) return;
    const b = boundsFromPoints(points.map((p) => ({ lat: p.latitude, lng: p.longitude })));
    if (b) {
      map.fitBounds(
        [
          [b.south, b.west],
          [b.north, b.east],
        ],
        { padding: [56, 56] },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points.length]);
  return null;
}

function AreaWatcher({ onMoved }: { onMoved: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onMoved(map.getBounds()),
    zoomend: () => onMoved(map.getBounds()),
  });
  return null;
}

export function PropertyMapInner({
  points,
  activeProperty,
  onActiveChange,
  className,
}: PropertyMapProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSearchArea, setShowSearchArea] = React.useState(false);
  const pendingBoundsRef = React.useRef<L.LatLngBounds | null>(null);
  const lastBoundsRef = React.useRef<Bounds | null>(null);
  const activeId = activeProperty?.id ?? null;

  const handleMoved = (b: L.LatLngBounds) => {
    const literal: Bounds = {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    };
    pendingBoundsRef.current = b;
    const prev = lastBoundsRef.current;
    if (prev && boundsChangedSignificantly(prev, literal)) {
      setShowSearchArea(true);
    }
    lastBoundsRef.current = literal;
  };

  const searchThisArea = () => {
    const b = pendingBoundsRef.current;
    if (!b) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("north", b.getNorth().toFixed(5));
    sp.set("south", b.getSouth().toFixed(5));
    sp.set("east", b.getEast().toFixed(5));
    sp.set("west", b.getWest().toFixed(5));
    router.replace(`?${sp.toString()}`, { scroll: false });
    setShowSearchArea(false);
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <MapContainer
        center={RD_CENTER}
        zoom={points.length ? 9 : 8}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ background: "#e8e8e8" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <FitToPoints points={points} />
        <AreaWatcher onMoved={handleMoved} />
        {points.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude, point.longitude]}
            icon={priceIcon(priceLabel(point), point.id === activeId)}
            eventHandlers={{ click: () => onActiveChange?.(point.id) }}
          />
        ))}
      </MapContainer>

      {showSearchArea && (
        <div className="absolute left-1/2 top-4 z-[1000] -translate-x-1/2">
          <Button size="sm" onClick={searchThisArea} className="shadow-lg">
            <SearchIcon className="size-4" />
            Buscar en esta zona
          </Button>
        </div>
      )}

      {activeProperty && (
        <div className="absolute inset-x-3 bottom-3 z-[1000] sm:left-3 sm:right-auto sm:w-72">
          <PropertyCard property={activeProperty} variant="map" />
        </div>
      )}
    </div>
  );
}
