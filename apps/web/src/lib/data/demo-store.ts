import "server-only";

import {
  demoAgencies,
  demoAgents,
  demoDevelopers,
  demoProjects,
  demoProperties,
  demoPropertySummaries,
} from "@paradise/database";
import {
  FEATURED_LOCATIONS,
  LOCATIONS,
  getLocationChildren,
  getLocationPath,
} from "@paradise/config";
import { pricePerM2 } from "@paradise/utils/currency";
import { haversineKm, isWithinBounds } from "@paradise/utils/geo";
import type {
  Agency,
  Agent,
  Developer,
  Location,
  Project,
  Property,
  PropertySummary,
} from "@paradise/types";
import type { ParsedPropertySearchParams } from "@paradise/validation";

/**
 * Almacén en memoria con los datos demo. Es la fuente de datos cuando no hay
 * Supabase configurado, y el fallback de desarrollo. Toda la lógica de filtrado
 * y orden vive aquí para que la capa `data/*` sea delgada.
 */

const USD_PER_DOP = 1 / 59; // referencia visual para comparar filtros multi-moneda

function toUsd(amount: number | null, currency: "USD" | "DOP"): number | null {
  if (amount == null) return null;
  return currency === "USD" ? amount : Math.round(amount * USD_PER_DOP);
}

// ── Propiedades ────────────────────────────────────────────────────────────
export function demoFeaturedProperties(limit = 8): PropertySummary[] {
  return demoPropertySummaries
    .filter((p) => p.isFeatured)
    .concat(demoPropertySummaries.filter((p) => !p.isFeatured))
    .slice(0, limit);
}

export function demoNewProperties(limit = 8): PropertySummary[] {
  return [...demoPropertySummaries]
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .slice(0, limit);
}

export interface DemoSearchResult {
  items: PropertySummary[];
  total: number;
  nextCursor: string | null;
  mapPoints: Array<{
    id: string;
    slug: string;
    latitude: number;
    longitude: number;
    price: number | null;
    currency: "USD" | "DOP";
  }>;
}

export function demoSearchProperties(params: ParsedPropertySearchParams): DemoSearchResult {
  let results = [...demoPropertySummaries];

  if (params.operationType) {
    results = results.filter((p) => p.operationType === params.operationType);
  }
  if (params.propertyTypes.length) {
    results = results.filter((p) => params.propertyTypes.includes(p.propertyType));
  }
  if (params.conditionStatus.length) {
    results = results.filter(
      (p) => p.conditionStatus && params.conditionStatus.includes(p.conditionStatus),
    );
  }
  if (params.locations.length) {
    const wanted = new Set(params.locations);
    results = results.filter((p) => {
      const chain = [p.location.sectorSlug, p.location.citySlug]
        .filter(Boolean)
        .flatMap((slug) => getLocationPath(slug as string).map((l) => l.slug));
      return chain.some((slug) => wanted.has(slug));
    });
  }
  if (params.minBedrooms) results = results.filter((p) => (p.bedrooms ?? 0) >= params.minBedrooms!);
  if (params.minBathrooms) {
    results = results.filter((p) => (p.bathrooms ?? 0) >= params.minBathrooms!);
  }
  if (params.minParking) {
    results = results.filter((p) => (p.parkingSpaces ?? 0) >= params.minParking!);
  }
  if (params.minAreaM2) {
    results = results.filter(
      (p) => (p.constructionM2 ?? p.landM2 ?? 0) >= params.minAreaM2!,
    );
  }
  if (params.maxAreaM2) {
    results = results.filter((p) => (p.constructionM2 ?? p.landM2 ?? 1e9) <= params.maxAreaM2!);
  }
  if (params.minPrice != null || params.maxPrice != null) {
    results = results.filter((p) => {
      const usd = toUsd(p.price.amount, p.price.currency);
      if (usd == null) return false;
      if (params.minPrice != null && usd < params.minPrice) return false;
      if (params.maxPrice != null && usd > params.maxPrice) return false;
      return true;
    });
  }
  if (params.verifiedOnly) results = results.filter((p) => p.isVerified);
  if (params.withProjectOnly) results = results.filter((p) => p.projectId != null);

  if (params.amenities.length) {
    const full = new Map(demoProperties.map((p) => [p.id, p.amenityKeys]));
    results = results.filter((p) => {
      const keys = full.get(p.id) ?? [];
      return params.amenities.every((a) => keys.includes(a));
    });
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    results = results.filter((p) =>
      [p.title, p.code, p.location.sector, p.location.city, p.location.province]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q)),
    );
  }

  const bounds =
    params.north != null && params.south != null && params.east != null && params.west != null
      ? { north: params.north, south: params.south, east: params.east, west: params.west }
      : null;
  if (bounds) {
    results = results.filter(
      (p) =>
        p.location.latitude != null &&
        p.location.longitude != null &&
        isWithinBounds({ lat: p.location.latitude, lng: p.location.longitude }, bounds),
    );
  }

  const total = results.length;

  results.sort((a, b) => {
    switch (params.sort) {
      case "recent":
        return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
      case "price_asc":
        return (toUsd(a.price.amount, a.price.currency) ?? 1e12) -
          (toUsd(b.price.amount, b.price.currency) ?? 1e12);
      case "price_desc":
        return (toUsd(b.price.amount, b.price.currency) ?? -1) -
          (toUsd(a.price.amount, a.price.currency) ?? -1);
      case "area_desc":
        return (b.constructionM2 ?? b.landM2 ?? 0) - (a.constructionM2 ?? a.landM2 ?? 0);
      case "price_per_m2_asc": {
        const pa = pricePerM2(toUsd(a.price.amount, a.price.currency), a.constructionM2 ?? a.landM2) ?? 1e9;
        const pb = pricePerM2(toUsd(b.price.amount, b.price.currency), b.constructionM2 ?? b.landM2) ?? 1e9;
        return pa - pb;
      }
      default:
        return Number(b.isFeatured) - Number(a.isFeatured) ||
          (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    }
  });

  const offset = params.cursor ? Number(params.cursor) || 0 : 0;
  const limit = params.limit ?? 24;
  const page = results.slice(offset, offset + limit);
  const nextCursor = offset + limit < total ? String(offset + limit) : null;

  return {
    items: page,
    total,
    nextCursor,
    mapPoints: results
      .filter((p) => p.location.latitude != null && p.location.longitude != null)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        latitude: p.location.latitude!,
        longitude: p.location.longitude!,
        price: p.price.amount,
        currency: p.price.currency,
      })),
  };
}

export function demoPropertyBySlug(slug: string): Property | null {
  return demoProperties.find((p) => p.slug === slug) ?? null;
}

export function demoPropertyByCode(code: string): Property | null {
  return demoProperties.find((p) => p.code.toLowerCase() === code.toLowerCase()) ?? null;
}

export function demoSimilarProperties(property: Property, limit = 4): PropertySummary[] {
  const origin =
    property.location.latitude != null && property.location.longitude != null
      ? { lat: property.location.latitude, lng: property.location.longitude }
      : null;

  return demoPropertySummaries
    .filter((p) => p.id !== property.id && p.operationType === property.operationType)
    .map((p) => {
      let score = 0;
      if (p.propertyType === property.propertyType) score += 3;
      if (p.location.citySlug === property.location.citySlug) score += 2;
      if (p.location.sectorSlug === property.location.sectorSlug) score += 2;
      if (Math.abs((p.bedrooms ?? 0) - (property.bedrooms ?? 0)) <= 1) score += 1;
      if (origin && p.location.latitude != null && p.location.longitude != null) {
        const km = haversineKm(origin, { lat: p.location.latitude, lng: p.location.longitude });
        if (km < 5) score += 2;
        else if (km < 15) score += 1;
      }
      return { p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export function demoAllPropertySlugs(): string[] {
  return demoProperties.map((p) => p.slug);
}

// ── Proyectos ──────────────────────────────────────────────────────────────
export function demoListProjects(): Project[] {
  return [...demoProjects].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
}
export function demoFeaturedProjects(limit = 6): Project[] {
  return demoListProjects().slice(0, limit);
}
export function demoProjectBySlug(slug: string): Project | null {
  return demoProjects.find((p) => p.slug === slug) ?? null;
}

// ── Agentes / Agencias / Desarrolladoras ──────────────────────────────────
export function demoListAgents(): Agent[] {
  return [...demoAgents].sort((a, b) => Number(b.isVerified) - Number(a.isVerified));
}
export function demoAgentBySlug(slug: string): Agent | null {
  return demoAgents.find((a) => a.slug === slug) ?? null;
}
export function demoAgentProperties(agentId: string): PropertySummary[] {
  return demoPropertySummaries.filter((p) => p.agent?.id === agentId);
}

export function demoListAgencies(): Agency[] {
  return [...demoAgencies].sort((a, b) => Number(b.isVerified) - Number(a.isVerified));
}
export function demoAgencyBySlug(slug: string): Agency | null {
  return demoAgencies.find((a) => a.slug === slug) ?? null;
}
export function demoAgencyProperties(agencyId: string): PropertySummary[] {
  return demoPropertySummaries.filter((p) => p.agency?.id === agencyId);
}
export function demoAgencyAgents(agencySlug: string): Agent[] {
  return demoAgents.filter((a) => a.agencySlug === agencySlug);
}

export function demoDeveloperBySlug(slug: string): Developer | null {
  return demoDevelopers.find((d) => d.slug === slug) ?? null;
}
export function demoDeveloperProjects(developerSlug: string): Project[] {
  return demoProjects.filter((p) => p.developer?.slug === developerSlug);
}

// ── Ubicaciones ────────────────────────────────────────────────────────────
export function demoFeaturedLocations(): Location[] {
  return FEATURED_LOCATIONS.map(toLocation);
}

export function demoLocationBySlug(slug: string): Location | null {
  const node = LOCATIONS.find((l) => l.slug === slug);
  return node ? toLocation(node) : null;
}

export function demoLocationChildren(slug: string): Location[] {
  return getLocationChildren(slug).map(toLocation);
}

function toLocation(node: (typeof LOCATIONS)[number]): Location {
  const count = demoPropertySummaries.filter((p) => {
    const chain = [p.location.sectorSlug, p.location.citySlug]
      .filter(Boolean)
      .flatMap((s) => getLocationPath(s as string).map((l) => l.slug));
    return chain.includes(node.slug);
  }).length;

  return {
    id: node.slug,
    slug: node.slug,
    name: node.name,
    type: node.type,
    parentId: node.parentSlug,
    parentSlug: node.parentSlug,
    latitude: node.latitude,
    longitude: node.longitude,
    isFeatured: node.isFeatured ?? false,
    blurb: node.blurb ?? null,
    imageUrl: null,
    propertyCount: count,
  };
}
