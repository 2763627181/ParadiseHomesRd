import type {
  ConditionStatus,
  Currency,
  OperationType,
  PropertyType,
} from "@paradise/config";
import type { Bounds } from "@paradise/utils/geo";
import type { Paginated } from "./common";
import type { PropertySummary } from "./property";

export type SortOption =
  | "relevance"
  | "recent"
  | "price_asc"
  | "price_desc"
  | "area_desc"
  | "price_per_m2_asc";

/** Estado canónico de búsqueda. Se serializa a/desde query string en la URL. */
export interface PropertySearchParams {
  q?: string;
  operationType?: OperationType;
  propertyTypes?: PropertyType[];
  /** slugs de ubicación (provincia/municipio/sector) */
  locations?: string[];
  minPrice?: number;
  maxPrice?: number;
  currency?: Currency;
  minBedrooms?: number;
  minBathrooms?: number;
  minParking?: number;
  minAreaM2?: number;
  maxAreaM2?: number;
  amenities?: string[];
  conditionStatus?: ConditionStatus[];
  verifiedOnly?: boolean;
  withProjectOnly?: boolean;
  /** bounding box para búsqueda en mapa */
  bounds?: Bounds;
  sort?: SortOption;
  cursor?: string;
  limit?: number;
}

export interface SearchFacet {
  key: string;
  label: string;
  count: number;
}

export interface PropertySearchResult extends Paginated<PropertySummary> {
  params: PropertySearchParams;
  facets: {
    propertyTypes: SearchFacet[];
    locations: SearchFacet[];
    priceBuckets: SearchFacet[];
  };
  /** todas las coordenadas del resultado, para pintar pins sin traer el detalle */
  mapPoints: Array<{
    id: string;
    slug: string;
    latitude: number;
    longitude: number;
    price: number | null;
    currency: Currency;
  }>;
}

export interface LocationSuggestion {
  slug: string;
  name: string;
  type: string;
  parentName: string | null;
  propertyCount: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  params: PropertySearchParams;
  alertFrequency: "off" | "instant" | "daily" | "weekly";
  createdAt: string;
  lastRunAt: string | null;
  newMatchCount: number;
}
