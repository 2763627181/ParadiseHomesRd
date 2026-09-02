import type { Currency, ProjectStatus, PropertyType, UnitStatus } from "@paradise/config";
import type { ImageAsset, ISODateString, Money, UUID, VideoAsset } from "./common";
import type { PropertyLocation } from "./location";
import type { Developer, DeveloperSummary } from "./people";

export interface ProjectSummary {
  id: UUID;
  code: string;
  slug: string;
  name: string;
  status: ProjectStatus;
  coverImage: ImageAsset | null;
  location: Pick<PropertyLocation, "sector" | "city" | "province" | "latitude" | "longitude">;
  priceFrom: Money;
  priceTo: Money | null;
  deliveryEstimate: ISODateString | null;
  bedroomsRange: [number, number] | null;
  availableUnits: number;
  totalUnits: number;
  developer: Pick<DeveloperSummary, "id" | "name" | "slug" | "logoUrl" | "isVerified"> | null;
  isVerified: boolean;
  isFeatured: boolean;
}

export interface ProjectBuilding {
  id: UUID;
  name: string;
  position: number;
  floors: number | null;
  unitCount: number;
}

export interface ProjectUnit {
  id: UUID;
  code: string;
  buildingId: UUID | null;
  buildingName: string | null;
  label: string;
  level: number | null;
  unitType: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  price: number | null;
  currency: Currency;
  status: UnitStatus;
  floorPlanUrl: string | null;
}

export interface PaymentPlan {
  id: UUID;
  name: string;
  separationAmount: Money | null;
  downPaymentPct: number;
  duringConstructionPct: number;
  onDeliveryPct: number;
  notes: string | null;
  isDefault: boolean;
}

export interface Project extends ProjectSummary {
  description: string;
  images: ImageAsset[];
  video: VideoAsset | null;
  masterplanUrl: string | null;
  location: PropertyLocation;
  amenityKeys: string[];
  buildings: ProjectBuilding[];
  units: ProjectUnit[];
  paymentPlans: PaymentPlan[];
  developer: Developer | null;
  deliveredUnits: number;
  isDemo: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}
