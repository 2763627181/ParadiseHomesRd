import {
  DEFAULT_SORT,
  type ConditionStatus,
  type PropertyType,
  type SortOption,
} from "@paradise/config";
import { propertySearchParamsSchema, type ParsedPropertySearchParams } from "@paradise/validation";
import type { PropertySearchParams } from "@paradise/types";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Parsea los searchParams de una ruta (tolerante) al estado canónico de búsqueda. */
export function parseSearchParams(raw: RawSearchParams): ParsedPropertySearchParams {
  const flat: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined) flat[key] = value;
  }
  return propertySearchParamsSchema.parse(flat);
}

/** Serializa el estado de búsqueda a un query string estable y legible. */
export function serializeSearchParams(params: Partial<PropertySearchParams>): string {
  const sp = new URLSearchParams();
  const set = (k: string, v: string | number | undefined | null) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  };
  const setList = (k: string, v?: string[]) => {
    if (v && v.length) sp.set(k, v.join(","));
  };

  set("q", params.q);
  set("operationType", params.operationType);
  setList("propertyTypes", params.propertyTypes);
  setList("locations", params.locations);
  set("minPrice", params.minPrice);
  set("maxPrice", params.maxPrice);
  set("currency", params.currency);
  set("minBedrooms", params.minBedrooms);
  set("minBathrooms", params.minBathrooms);
  set("minParking", params.minParking);
  set("minAreaM2", params.minAreaM2);
  set("maxAreaM2", params.maxAreaM2);
  setList("amenities", params.amenities);
  setList("conditionStatus", params.conditionStatus);
  if (params.verifiedOnly) sp.set("verifiedOnly", "1");
  if (params.withProjectOnly) sp.set("withProjectOnly", "1");
  if (params.bounds) {
    set("north", params.bounds.north);
    set("south", params.bounds.south);
    set("east", params.bounds.east);
    set("west", params.bounds.west);
  }
  if (params.sort && params.sort !== DEFAULT_SORT) sp.set("sort", params.sort);

  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

/** Convierte los params parseados de vuelta a la forma "de dominio" (con bounds objeto). */
export function toDomainParams(parsed: ParsedPropertySearchParams): PropertySearchParams {
  const bounds =
    parsed.north != null && parsed.south != null && parsed.east != null && parsed.west != null
      ? { north: parsed.north, south: parsed.south, east: parsed.east, west: parsed.west }
      : undefined;

  return {
    q: parsed.q,
    operationType: parsed.operationType,
    propertyTypes: parsed.propertyTypes as PropertyType[],
    locations: parsed.locations,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    currency: parsed.currency,
    minBedrooms: parsed.minBedrooms,
    minBathrooms: parsed.minBathrooms,
    minParking: parsed.minParking,
    minAreaM2: parsed.minAreaM2,
    maxAreaM2: parsed.maxAreaM2,
    amenities: parsed.amenities,
    conditionStatus: parsed.conditionStatus as ConditionStatus[],
    verifiedOnly: parsed.verifiedOnly,
    withProjectOnly: parsed.withProjectOnly,
    bounds,
    sort: parsed.sort as SortOption,
    cursor: parsed.cursor,
    limit: parsed.limit,
  };
}

/** Cuenta filtros activos (para el badge del botón de filtros). */
export function countActiveFilters(params: ParsedPropertySearchParams): number {
  let n = 0;
  if (params.propertyTypes.length) n++;
  if (params.locations.length) n++;
  if (params.minPrice != null || params.maxPrice != null) n++;
  if (params.minBedrooms) n++;
  if (params.minBathrooms) n++;
  if (params.minParking) n++;
  if (params.minAreaM2 != null || params.maxAreaM2 != null) n++;
  if (params.amenities.length) n++;
  if (params.conditionStatus.length) n++;
  if (params.verifiedOnly) n++;
  if (params.withProjectOnly) n++;
  return n;
}
