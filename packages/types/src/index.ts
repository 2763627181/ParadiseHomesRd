export type * from "./common.js";
export type * from "./location.js";
export type * from "./people.js";
export type * from "./property.js";
export type * from "./project.js";
export type * from "./lead.js";
export type * from "./search.js";
export type * from "./dashboard.js";

// Re-export de enums de dominio para un único punto de importación en apps.
export {
  OPERATION_TYPE,
  PROPERTY_TYPE,
  PROPERTY_STATUS,
  CONDITION_STATUS,
  CURRENCY,
  LOCATION_TYPE,
  USER_ROLE,
  LEAD_STATUS,
  LEAD_SOURCE,
  LEAD_CHANNEL,
  VISIT_STATUS,
  UNIT_STATUS,
  PROJECT_STATUS,
  VERIFICATION_STATUS,
  COMMISSION_STATUS,
  ANALYTICS_EVENT,
} from "@paradise/config";
export type {
  OperationType,
  PropertyType,
  PropertyStatus,
  ConditionStatus,
  Currency,
  LocationType,
  UserRole,
  OrgMemberRole,
  LeadStatus,
  LeadSource,
  LeadChannel,
  VisitStatus,
  UnitStatus,
  ProjectStatus,
  VerificationStatus,
  VerificationTarget,
  CommissionStatus,
  AlertFrequency,
  NotificationChannel,
  AnalyticsEventName,
} from "@paradise/config";
