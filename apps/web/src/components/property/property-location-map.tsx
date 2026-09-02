import { MapPinIcon } from "lucide-react";

import { env, isMapsConfigured } from "@/lib/env";

interface PropertyLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  label: string;
  approximate?: boolean;
  zoom?: number;
}

/**
 * Mapa de ubicación del inmueble. Usa el Google Maps Embed API si hay API key;
 * si no, muestra un placeholder elegante. Cuando la dirección es aproximada,
 * no se marca un punto exacto.
 */
export function PropertyLocationMap({
  latitude,
  longitude,
  label,
  approximate = false,
  zoom = 14,
}: PropertyLocationMapProps) {
  if (latitude == null || longitude == null) return null;

  if (isMapsConfigured) {
    const q = approximate ? label : `${latitude},${longitude}`;
    const src = `https://www.google.com/maps/embed/v1/${approximate ? "search" : "place"}?key=${env.GOOGLE_MAPS_KEY}&q=${encodeURIComponent(q)}&zoom=${approximate ? zoom - 2 : zoom}`;
    return (
      <div className="overflow-hidden rounded-xl border border-border/70">
        <iframe
          title={`Mapa de ${label}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[320px] w-full sm:h-[380px]"
        />
        {approximate && (
          <p className="bg-card px-4 py-2 text-xs text-muted-foreground">
            Ubicación aproximada. La dirección exacta se comparte al contactar.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-[320px] items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-secondary bg-grid sm:h-[380px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <MapPinIcon className="size-5" />
        </span>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {approximate ? "Ubicación aproximada" : "Ver ubicación al contactar"}
        </p>
      </div>
    </div>
  );
}
