import type {
  ConditionStatus,
  Currency,
  OperationType,
  PropertyStatus,
  PropertyType,
} from "@paradise/config";
import type { ImageAsset, ISODateString, Money, UUID, VideoAsset } from "./common.js";
import type { PropertyLocation } from "./location.js";
import type { AgencySummary, AgentSummary } from "./people.js";

export interface PropertyFeature {
  key: string;
  label: string;
  value: string | boolean | number | null;
  group: string;
}

/** Versión ligera para cards, listados, mapa, favoritos, "similares". */
export interface PropertySummary {
  id: UUID;
  code: string;
  slug: string;
  title: string;
  operationType: OperationType;
  propertyType: PropertyType;
  conditionStatus: ConditionStatus | null;
  price: Money;
  bedrooms: number | null;
  bathrooms: number | null;
  parkingSpaces: number | null;
  constructionM2: number | null;
  landM2: number | null;
  coverImage: ImageAsset | null;
  imageCount: number;
  location: Pick<
    PropertyLocation,
    "sector" | "sectorSlug" | "city" | "citySlug" | "province" | "latitude" | "longitude"
  >;
  isVerified: boolean;
  isFeatured: boolean;
  isNew: boolean;
  agency: Pick<AgencySummary, "id" | "name" | "slug" | "logoUrl" | "isVerified"> | null;
  agent: Pick<AgentSummary, "id" | "slug" | "fullName" | "avatarUrl" | "isVerified"> | null;
  projectId: UUID | null;
  publishedAt: ISODateString | null;
  lastVerifiedAt: ISODateString | null;
}

/** Versión completa para `/property/[slug]`. */
export interface Property extends PropertySummary {
  description: string;
  status: PropertyStatus;
  images: ImageAsset[];
  video: VideoAsset | null;
  virtualTourUrl: string | null;
  location: PropertyLocation;
  features: PropertyFeature[];
  amenityKeys: string[];
  maintenanceFee: Money | null;
  yearBuilt: number | null;
  floor: number | null;
  totalFloors: number | null;
  furnished: boolean;
  petFriendly: boolean;
  airbnbFriendly: boolean;
  deliveryDate: ISODateString | null;
  project: { id: UUID; slug: string; name: string; developerName: string | null } | null;
  agent: AgentSummary | null;
  agency: AgencySummary | null;
  priceHistory: Array<{ price: number; currency: Currency; changedAt: ISODateString }>;
  isDemo: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  viewCount: number;
  favoriteCount: number;
}

export interface PropertyComparisonRow {
  property: PropertySummary;
  pricePerM2: number | null;
  maintenanceFee: Money | null;
  deliveryDate: ISODateString | null;
  amenityKeys: string[];
  airbnbFriendly: boolean;
  conditionStatus: ConditionStatus | null;
}
