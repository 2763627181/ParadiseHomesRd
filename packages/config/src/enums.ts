/**
 * Enums de dominio de Paradise Homes RD.
 * Se declaran como objetos `as const` + tipo unión para poder iterarlos en UI
 * y mantenerlos sincronizados con los tipos ENUM de Postgres (ver migraciones).
 */

export const OPERATION_TYPE = {
  SALE: "SALE",
  RENT: "RENT",
} as const;
export type OperationType = (typeof OPERATION_TYPE)[keyof typeof OPERATION_TYPE];

export const PROPERTY_TYPE = {
  APARTMENT: "APARTMENT",
  HOUSE: "HOUSE",
  VILLA: "VILLA",
  PENTHOUSE: "PENTHOUSE",
  LOT: "LOT",
  LAND: "LAND",
  COMMERCIAL: "COMMERCIAL",
  OFFICE: "OFFICE",
} as const;
export type PropertyType = (typeof PROPERTY_TYPE)[keyof typeof PROPERTY_TYPE];

export const PROPERTY_STATUS = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;
export type PropertyStatus = (typeof PROPERTY_STATUS)[keyof typeof PROPERTY_STATUS];

export const CONDITION_STATUS = {
  NEW: "NEW",
  USED: "USED",
  OFF_PLAN: "OFF_PLAN",
  UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION",
  READY_TO_MOVE: "READY_TO_MOVE",
} as const;
export type ConditionStatus = (typeof CONDITION_STATUS)[keyof typeof CONDITION_STATUS];

export const CURRENCY = {
  USD: "USD",
  DOP: "DOP",
} as const;
export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

export const LOCATION_TYPE = {
  COUNTRY: "COUNTRY",
  PROVINCE: "PROVINCE",
  MUNICIPALITY: "MUNICIPALITY",
  SECTOR: "SECTOR",
} as const;
export type LocationType = (typeof LOCATION_TYPE)[keyof typeof LOCATION_TYPE];

export const USER_ROLE = {
  USER: "USER",
  AGENT: "AGENT",
  AGENCY_ADMIN: "AGENCY_ADMIN",
  DEVELOPER: "DEVELOPER",
  DEVELOPER_ADMIN: "DEVELOPER_ADMIN",
  ADMIN: "ADMIN",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export const ORG_MEMBER_ROLE = {
  OWNER: "owner",
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
} as const;
export type OrgMemberRole = (typeof ORG_MEMBER_ROLE)[keyof typeof ORG_MEMBER_ROLE];

export const LEAD_STATUS = {
  NEW: "NEW",
  CONTACTED: "CONTACTED",
  QUALIFIED: "QUALIFIED",
  VISIT_SCHEDULED: "VISIT_SCHEDULED",
  VISIT_COMPLETED: "VISIT_COMPLETED",
  NEGOTIATING: "NEGOTIATING",
  RESERVED: "RESERVED",
  CLOSED_WON: "CLOSED_WON",
  CLOSED_LOST: "CLOSED_LOST",
} as const;
export type LeadStatus = (typeof LEAD_STATUS)[keyof typeof LEAD_STATUS];

/** Orden del pipeline visual (excluye estados terminales que se muestran aparte). */
export const LEAD_PIPELINE_ORDER: LeadStatus[] = [
  LEAD_STATUS.NEW,
  LEAD_STATUS.CONTACTED,
  LEAD_STATUS.QUALIFIED,
  LEAD_STATUS.VISIT_SCHEDULED,
  LEAD_STATUS.VISIT_COMPLETED,
  LEAD_STATUS.NEGOTIATING,
  LEAD_STATUS.RESERVED,
];

export const LEAD_SOURCE = {
  META_ADS: "meta_ads",
  INSTAGRAM: "instagram",
  FACEBOOK: "facebook",
  TIKTOK: "tiktok",
  GOOGLE: "google",
  YOUTUBE: "youtube",
  ORGANIC: "organic",
  REFERRAL: "referral",
  DIRECT: "direct",
} as const;
export type LeadSource = (typeof LEAD_SOURCE)[keyof typeof LEAD_SOURCE];

export const LEAD_CHANNEL = {
  PROPERTY_FORM: "property_form",
  WHATSAPP: "whatsapp",
  PHONE: "phone",
  SCHEDULE_VISIT: "schedule_visit",
  PARTNER_APPLICATION: "partner_application",
  LIST_PROPERTY: "list_property",
  CONTACT_PAGE: "contact_page",
} as const;
export type LeadChannel = (typeof LEAD_CHANNEL)[keyof typeof LEAD_CHANNEL];

export const VISIT_STATUS = {
  REQUESTED: "REQUESTED",
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  NO_SHOW: "NO_SHOW",
  CANCELLED: "CANCELLED",
} as const;
export type VisitStatus = (typeof VISIT_STATUS)[keyof typeof VISIT_STATUS];

export const UNIT_STATUS = {
  AVAILABLE: "AVAILABLE",
  RESERVED: "RESERVED",
  SOLD: "SOLD",
  BLOCKED: "BLOCKED",
} as const;
export type UnitStatus = (typeof UNIT_STATUS)[keyof typeof UNIT_STATUS];

export const PROJECT_STATUS = {
  PRE_SALE: "PRE_SALE",
  UNDER_CONSTRUCTION: "UNDER_CONSTRUCTION",
  READY: "READY",
  DELIVERED: "DELIVERED",
  SOLD_OUT: "SOLD_OUT",
} as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

export const VERIFICATION_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS];

export const VERIFICATION_TARGET = {
  AGENT: "agent",
  AGENCY: "agency",
  DEVELOPER: "developer",
  PROJECT: "project",
  PROPERTY: "property",
} as const;
export type VerificationTarget = (typeof VERIFICATION_TARGET)[keyof typeof VERIFICATION_TARGET];

export const COMMISSION_STATUS = {
  PENDING: "PENDING",
  INVOICED: "INVOICED",
  PAID: "PAID",
  DISPUTED: "DISPUTED",
  CANCELLED: "CANCELLED",
} as const;
export type CommissionStatus = (typeof COMMISSION_STATUS)[keyof typeof COMMISSION_STATUS];

export const ALERT_FREQUENCY = {
  OFF: "off",
  INSTANT: "instant",
  DAILY: "daily",
  WEEKLY: "weekly",
} as const;
export type AlertFrequency = (typeof ALERT_FREQUENCY)[keyof typeof ALERT_FREQUENCY];

export const NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  IN_APP: "in_app",
  PUSH: "push",
} as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[keyof typeof NOTIFICATION_CHANNEL];

export const ANALYTICS_EVENT = {
  PAGE_VIEW: "page_view",
  SEARCH: "search",
  PROPERTY_VIEW: "property_view",
  PROJECT_VIEW: "project_view",
  FAVORITE_ADDED: "favorite_added",
  FAVORITE_REMOVED: "favorite_removed",
  SHARE_CLICKED: "share_clicked",
  WHATSAPP_CLICKED: "whatsapp_clicked",
  PHONE_CLICKED: "phone_clicked",
  LEAD_CREATED: "lead_created",
  VISIT_REQUESTED: "visit_requested",
  VISIT_COMPLETED: "visit_completed",
  RESERVATION_CREATED: "reservation_created",
  CLOSING_CREATED: "closing_created",
} as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT];
