import { z } from "zod";
import {
  conditionStatusSchema,
  currencySchema,
  operationTypeSchema,
  propertyTypeSchema,
} from "./primitives";

/**
 * Lista separada por comas (o repetida) → array de strings.
 * Si se pasa `allowed`, filtra a ese conjunto; si no, devuelve todo saneado.
 */
function csv(allowed?: readonly string[]) {
  return z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value): string[] => {
      if (!value) return [];
      const parts = Array.isArray(value) ? value : value.split(",");
      const cleaned = parts.map((p) => p.trim()).filter(Boolean);
      return allowed ? cleaned.filter((p) => allowed.includes(p)) : cleaned;
    });
}

const numberParam = z.coerce.number().optional().catch(undefined);
const boolParam = z
  .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false"), z.boolean()])
  .optional()
  .transform((v) => v === true || v === "1" || v === "true");

export const sortSchema = z
  .enum(["relevance", "recent", "price_asc", "price_desc", "area_desc", "price_per_m2_asc"])
  .catch("relevance");

/**
 * Parseo tolerante de los parámetros de búsqueda desde la URL.
 * Entradas inválidas se descartan en vez de romper la página.
 */
export const propertySearchParamsSchema = z.object({
  q: z.string().trim().max(120).optional(),
  operationType: operationTypeSchema.optional().catch(undefined),
  propertyTypes: csv(propertyTypeSchema.options),
  locations: csv(),
  minPrice: numberParam,
  maxPrice: numberParam,
  currency: currencySchema.optional().catch(undefined),
  minBedrooms: numberParam,
  minBathrooms: numberParam,
  minParking: numberParam,
  minAreaM2: numberParam,
  maxAreaM2: numberParam,
  amenities: csv(),
  conditionStatus: csv(conditionStatusSchema.options),
  verifiedOnly: boolParam,
  withProjectOnly: boolParam,
  north: numberParam,
  south: numberParam,
  east: numberParam,
  west: numberParam,
  sort: sortSchema,
  cursor: z.string().max(400).optional(),
  limit: z.coerce.number().int().min(1).max(60).catch(24),
});

export type PropertySearchParamsInput = z.input<typeof propertySearchParamsSchema>;
export type ParsedPropertySearchParams = z.output<typeof propertySearchParamsSchema>;

export const savedSearchSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre a la búsqueda").max(80),
  params: z.record(z.string(), z.unknown()),
  alertFrequency: z.enum(["off", "instant", "daily", "weekly"]).default("instant"),
});

export const locationAutocompleteSchema = z.object({
  q: z.string().trim().min(1).max(80),
  limit: z.coerce.number().int().min(1).max(15).catch(8),
});
