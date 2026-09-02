export type * from "./common";
export type * from "./location";
export type * from "./people";
export type * from "./property";
export type * from "./project";
export type * from "./lead";
export type * from "./search";
export type * from "./dashboard";

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
