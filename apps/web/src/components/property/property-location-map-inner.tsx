"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer } from "react-leaflet";

import type { PropertyLocationMapProps } from "./property-location-map";

const pinIcon = L.divIcon({
  className: "",
  iconSize: [0, 0],
  html:
    `<div style="transform:translate(-50%,-50%);width:16px;height:16px;border-radius:9999px;` +
    `background:#e11d48;border:3px solid #ffffff;box-shadow:0 1px 5px rgba(0,0,0,.42)"></div>`,
});

export function PropertyLocationMapInner({
  latitude,
  longitude,
  label,
  approximate = false,
  zoom = 14,
}: PropertyLocationMapProps) {
  if (latitude == null || longitude == null) return null;
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <MapContainer
        center={center}
        zoom={approximate ? Math.max(1, zoom - 2) : zoom}
        scrollWheelZoom={false}
        className="h-[320px] w-full sm:h-[380px]"
        style={{ background: "#e8e8e8" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        {approximate ? (
          <Circle
            center={center}
            radius={700}
            pathOptions={{ color: "#e11d48", fillColor: "#e11d48", fillOpacity: 0.12, weight: 1.5 }}
          />
        ) : (
          <Marker position={center} icon={pinIcon} title={label} />
        )}
      </MapContainer>
      {approximate && (
        <p className="bg-card px-4 py-2 text-xs text-muted-foreground">
          Ubicación aproximada. La dirección exacta se comparte al contactar.
        </p>
      )}
    </div>
  );
}
