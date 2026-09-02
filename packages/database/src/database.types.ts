/**
 * Tipos de la base de datos de Supabase.
 *
 * ⚠️  Este archivo se REGENERA con `pnpm db:types`
 *     (`supabase gen types typescript --project-id $SUPABASE_PROJECT_ID`).
 *
 * Mientras no haya un proyecto Supabase conectado, esta es una versión escrita
 * a mano que cubre las tablas y vistas del MVP y se mantiene en sincronía con
 * `migrations/*.sql`. No añadir lógica aquí.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ──────────────────────────────────────────────────────────────────
export type OperationTypeDB = "SALE" | "RENT";
export type PropertyTypeDB =
  | "APARTMENT"
  | "HOUSE"
  | "VILLA"
  | "PENTHOUSE"
  | "LOT"
  | "LAND"
  | "COMMERCIAL"
  | "OFFICE";
export type PropertyStatusDB = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type ConditionStatusDB =
  | "NEW"
  | "USED"
  | "OFF_PLAN"
  | "UNDER_CONSTRUCTION"
  | "READY_TO_MOVE";
export type CurrencyDB = "USD" | "DOP";
export type LocationTypeDB = "COUNTRY" | "PROVINCE" | "MUNICIPALITY" | "SECTOR";
export type UserRoleDB =
  | "USER"
  | "AGENT"
  | "AGENCY_ADMIN"
  | "DEVELOPER"
  | "DEVELOPER_ADMIN"
  | "ADMIN"
  | "SUPER_ADMIN";
export type LeadStatusDB =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "VISIT_SCHEDULED"
  | "VISIT_COMPLETED"
  | "NEGOTIATING"
  | "RESERVED"
  | "CLOSED_WON"
  | "CLOSED_LOST";
export type LeadSourceDB =
  | "meta_ads"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "google"
  | "youtube"
  | "organic"
  | "referral"
  | "direct";
export type LeadChannelDB =
  | "property_form"
  | "whatsapp"
  | "phone"
  | "schedule_visit"
  | "partner_application"
  | "list_property"
  | "contact_page";
export type UnitStatusDB = "AVAILABLE" | "RESERVED" | "SOLD" | "BLOCKED";
export type ProjectStatusDB =
  | "PRE_SALE"
  | "UNDER_CONSTRUCTION"
  | "READY"
  | "DELIVERED"
  | "SOLD_OUT";
export type VisitStatusDB = "REQUESTED" | "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
export type ModerationStateDB =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PUBLISHED"
  | "REJECTED"
  | "ARCHIVED";

type Timestamps = { created_at: string; updated_at: string };
type WithDefaults<T> = Partial<T>;

// ── Row shapes (tablas núcleo) ─────────────────────────────────────────────
export interface ProfileRow extends Timestamps {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  role: UserRoleDB;
  locale: string;
  timezone: string;
  is_demo: boolean;
}

export interface LocationRow {
  id: string;
  slug: string;
  name: string;
  type: LocationTypeDB;
  parent_id: string | null;
  latitude: number;
  longitude: number;
  is_featured: boolean;
  blurb: string | null;
  image_url: string | null;
  property_count: number;
  created_at: string;
}

export interface AgencyRow extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city_id: string | null;
  areas: string[];
  social_links: Json;
  founded_year: number | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  is_demo: boolean;
}

export interface DeveloperRow extends Timestamps {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  areas: string[];
  founded_year: number | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  is_demo: boolean;
}

export interface AgentRow extends Timestamps {
  id: string;
  profile_id: string | null;
  agency_id: string | null;
  slug: string;
  full_name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  languages: string[];
  areas: string[];
  years_experience: number | null;
  response_time_minutes: number | null;
  rating_average: number | null;
  rating_count: number;
  social_links: Json;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  is_demo: boolean;
}

export interface PropertyRow extends Timestamps {
  id: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  operation_type: OperationTypeDB;
  property_type: PropertyTypeDB;
  condition_status: ConditionStatusDB | null;
  price: number | null;
  price_on_request: boolean;
  currency: CurrencyDB;
  maintenance_fee: number | null;
  maintenance_fee_currency: CurrencyDB | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  construction_m2: number | null;
  land_m2: number | null;
  year_built: number | null;
  floor: number | null;
  total_floors: number | null;
  furnished: boolean;
  pet_friendly: boolean;
  airbnb_friendly: boolean;
  address: string | null;
  sector_id: string | null;
  city_id: string | null;
  province_id: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  hide_exact_location: boolean;
  status: PropertyStatusDB;
  moderation_state: ModerationStateDB;
  reject_reason: string | null;
  agency_id: string | null;
  agent_id: string | null;
  developer_id: string | null;
  project_id: string | null;
  owner_profile_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  video_url: string | null;
  virtual_tour_url: string | null;
  is_featured: boolean;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  view_count: number;
  favorite_count: number;
  lead_count: number;
  is_demo: boolean;
  search_vector: unknown;
  published_at: string | null;
  last_verified_at: string | null;
}

export interface PropertyImageRow {
  id: string;
  property_id: string;
  url: string;
  storage_path: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
  position: number;
  is_cover: boolean;
  created_at: string;
}

export interface PropertyFeatureRow {
  id: string;
  property_id: string;
  key: string;
  label: string;
  value: string | null;
  group_key: string;
}

export interface PropertyAmenityRow {
  property_id: string;
  key: string;
}

export interface ProjectRow extends Timestamps {
  id: string;
  code: string;
  slug: string;
  name: string;
  description: string;
  developer_id: string | null;
  agency_id: string | null;
  address: string | null;
  sector_id: string | null;
  city_id: string | null;
  province_id: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ProjectStatusDB;
  moderation_state: ModerationStateDB;
  price_from: number | null;
  price_to: number | null;
  currency: CurrencyDB;
  delivery_estimate: string | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  masterplan_url: string | null;
  video_url: string | null;
  amenity_keys: string[];
  is_verified: boolean;
  is_featured: boolean;
  is_demo: boolean;
  published_at: string | null;
}

export interface ProjectUnitRow extends Timestamps {
  id: string;
  project_id: string;
  building_id: string | null;
  code: string;
  label: string;
  level: number | null;
  unit_type: PropertyTypeDB;
  bedrooms: number | null;
  bathrooms: number | null;
  area_m2: number | null;
  price: number | null;
  currency: CurrencyDB;
  status: UnitStatusDB;
  floor_plan_url: string | null;
}

export interface FavoriteRow {
  id: string;
  user_id: string;
  property_id: string | null;
  project_id: string | null;
  created_at: string;
}

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  params: Json;
  alert_frequency: "off" | "instant" | "daily" | "weekly";
  last_run_at: string | null;
  last_seen_at: string;
  created_at: string;
}

export interface ContactRow extends Timestamps {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  profile_id: string | null;
  is_demo: boolean;
}

export interface LeadRow extends Timestamps {
  id: string;
  lead_code: string;
  contact_id: string;
  property_id: string | null;
  project_id: string | null;
  unit_id: string | null;
  agent_id: string | null;
  agency_id: string | null;
  developer_id: string | null;
  source: LeadSourceDB;
  channel: LeadChannelDB;
  status: LeadStatusDB;
  message: string | null;
  intent: string;
  campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  referrer: string | null;
  landing_page: string | null;
  first_touch: Json | null;
  last_touch: Json | null;
  assigned_at: string | null;
  assigned_by: string | null;
  next_activity_at: string | null;
  contacted_at: string | null;
  qualified_at: string | null;
  closed_at: string | null;
  is_demo: boolean;
}

export interface AnalyticsEventRow {
  id: number;
  name: string;
  session_id: string | null;
  user_id: string | null;
  property_id: string | null;
  project_id: string | null;
  lead_id: string | null;
  agent_id: string | null;
  agency_id: string | null;
  props: Json;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  path: string | null;
  occurred_at: string;
}

// ── Vista property_summaries ───────────────────────────────────────────────
export interface PropertySummaryViewRow {
  id: string;
  code: string;
  slug: string;
  title: string;
  operation_type: OperationTypeDB;
  property_type: PropertyTypeDB;
  condition_status: ConditionStatusDB | null;
  price: number | null;
  price_on_request: boolean;
  currency: CurrencyDB;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spaces: number | null;
  construction_m2: number | null;
  land_m2: number | null;
  status: PropertyStatusDB;
  is_featured: boolean;
  is_verified: boolean;
  project_id: string | null;
  latitude: number | null;
  longitude: number | null;
  hide_exact_location: boolean;
  published_at: string | null;
  last_verified_at: string | null;
  created_at: string;
  view_count: number;
  favorite_count: number;
  lead_count: number;
  is_demo: boolean;
  sector_name: string | null;
  sector_slug: string | null;
  city_name: string | null;
  city_slug: string | null;
  province_name: string | null;
  province_slug: string | null;
  agency_id: string | null;
  agency_name: string | null;
  agency_slug: string | null;
  agency_logo_url: string | null;
  agency_verified: boolean | null;
  agent_id: string | null;
  agent_slug: string | null;
  agent_name: string | null;
  agent_avatar_url: string | null;
  agent_verified: boolean | null;
  image_count: number;
  cover_url: string | null;
  cover_blur: string | null;
}

type TableDef<Row> = {
  Row: Row;
  Insert: WithDefaults<Row>;
  Update: WithDefaults<Row>;
  Relationships: [];
};

type ViewDef<Row> = { Row: Row };

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      locations: TableDef<LocationRow>;
      agencies: TableDef<AgencyRow>;
      developers: TableDef<DeveloperRow>;
      agents: TableDef<AgentRow>;
      properties: TableDef<PropertyRow>;
      property_images: TableDef<PropertyImageRow>;
      property_features: TableDef<PropertyFeatureRow>;
      property_amenities: TableDef<PropertyAmenityRow>;
      projects: TableDef<ProjectRow>;
      project_units: TableDef<ProjectUnitRow>;
      favorites: TableDef<FavoriteRow>;
      saved_searches: TableDef<SavedSearchRow>;
      contacts: TableDef<ContactRow>;
      leads: TableDef<LeadRow>;
      analytics_events: TableDef<AnalyticsEventRow>;
    };
    Views: {
      property_summaries: ViewDef<PropertySummaryViewRow>;
    };
    Functions: Record<string, never>;
    Enums: {
      operation_type: OperationTypeDB;
      property_type: PropertyTypeDB;
      property_status: PropertyStatusDB;
      condition_status: ConditionStatusDB;
      currency_code: CurrencyDB;
      location_type: LocationTypeDB;
      user_role: UserRoleDB;
      lead_status: LeadStatusDB;
      lead_source: LeadSourceDB;
      lead_channel: LeadChannelDB;
      unit_status: UnitStatusDB;
      project_status: ProjectStatusDB;
      visit_status: VisitStatusDB;
      moderation_state: ModerationStateDB;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
