import slugify from "slugify";

export function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, locale: "es", trim: true });
}

/**
 * Slug SEO de propiedad:
 *   apartamento-3-habitaciones-piantini-ph-apt-00291
 * El `code` al final garantiza unicidad y permite resolver la propiedad.
 */
export function buildPropertySlug(input: {
  propertyTypeLabel: string;
  bedrooms?: number | null;
  operationLabel?: string | null;
  sector?: string | null;
  city?: string | null;
  code: string;
}): string {
  const parts: string[] = [toSlug(input.propertyTypeLabel)];

  if (input.bedrooms != null) {
    parts.push(input.bedrooms === 0 ? "estudio" : `${input.bedrooms}-habitaciones`);
  }
  if (input.operationLabel) parts.push(toSlug(input.operationLabel));
  const place = input.sector ?? input.city;
  if (place) parts.push(toSlug(place));
  parts.push(toSlug(input.code));

  return parts.filter(Boolean).join("-");
}

export function buildProjectSlug(input: { name: string; city?: string | null }): string {
  return [toSlug(input.name), input.city ? toSlug(input.city) : ""].filter(Boolean).join("-");
}

/** Extrae el código PH-XXX-00000 desde un slug de propiedad. */
export function extractCodeFromSlug(slug: string): string | null {
  const match = slug.match(/(ph-[a-z]{3}-\d{3,})$/i);
  return match ? match[1]!.toUpperCase() : null;
}
