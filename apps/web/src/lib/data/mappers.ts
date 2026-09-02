import "server-only";

import type {
  PropertyImageRow,
  PropertySummaryViewRow,
} from "@paradise/database/types";
import type { ImageAsset, PropertySummary } from "@paradise/types";

const DAY = 86_400_000;

export function rowToImageAsset(row: PropertyImageRow): ImageAsset {
  return {
    id: row.id,
    url: row.url,
    storagePath: row.storage_path,
    alt: row.alt,
    width: row.width,
    height: row.height,
    blurDataUrl: row.blur_data_url,
    position: row.position,
    isCover: row.is_cover,
  };
}

export function viewRowToPropertySummary(row: PropertySummaryViewRow): PropertySummary {
  const publishedAt = row.published_at ?? row.created_at;
  const isNew = Date.now() - new Date(publishedAt).getTime() < 10 * DAY;

  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    operationType: row.operation_type,
    propertyType: row.property_type,
    conditionStatus: row.condition_status,
    price: {
      amount: row.price_on_request ? null : row.price,
      currency: row.currency,
      onRequest: row.price_on_request,
      period: row.operation_type === "RENT" ? "month" : null,
    },
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingSpaces: row.parking_spaces,
    constructionM2: row.construction_m2,
    landM2: row.land_m2,
    coverImage: row.cover_url
      ? {
          id: `${row.id}-cover`,
          url: row.cover_url,
          alt: row.title,
          blurDataUrl: row.cover_blur,
          position: 0,
          isCover: true,
        }
      : null,
    imageCount: row.image_count,
    location: {
      sector: row.sector_name,
      sectorSlug: row.sector_slug,
      city: row.city_name,
      citySlug: row.city_slug,
      province: row.province_name,
      latitude: row.latitude,
      longitude: row.longitude,
    },
    isVerified: row.is_verified,
    isFeatured: row.is_featured,
    isNew,
    agency: row.agency_id
      ? {
          id: row.agency_id,
          name: row.agency_name ?? "",
          slug: row.agency_slug ?? "",
          logoUrl: row.agency_logo_url,
          isVerified: Boolean(row.agency_verified),
        }
      : null,
    agent: row.agent_id
      ? {
          id: row.agent_id,
          slug: row.agent_slug ?? "",
          fullName: row.agent_name ?? "",
          avatarUrl: row.agent_avatar_url,
          isVerified: Boolean(row.agent_verified),
        }
      : null,
    projectId: row.project_id,
    publishedAt: row.published_at,
    lastVerifiedAt: row.last_verified_at,
  };
}
