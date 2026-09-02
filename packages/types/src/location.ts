import type { LocationType } from "@paradise/config";
import type { UUID } from "./common";

export interface Location {
  id: UUID;
  slug: string;
  name: string;
  type: LocationType;
  parentId: UUID | null;
  parentSlug: string | null;
  latitude: number;
  longitude: number;
  isFeatured: boolean;
  blurb: string | null;
  imageUrl: string | null;
  /** conteo de propiedades publicadas (para páginas de zona) */
  propertyCount?: number;
}

/** Ubicación resuelta y desnormalizada de una propiedad. */
export interface PropertyLocation {
  address: string | null;
  sector: string | null;
  sectorSlug: string | null;
  city: string | null;
  citySlug: string | null;
  province: string | null;
  provinceSlug: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  /** ocultar dirección exacta en el mapa público */
  hideExactLocation: boolean;
}

export interface LocationBreadcrumb {
  slug: string;
  name: string;
  type: LocationType;
}
