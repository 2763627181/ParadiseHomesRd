import type { OrgMemberRole, UserRole } from "@paradise/config";
import type { ISODateString, UUID } from "./common.js";

export interface Profile {
  id: UUID;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  avatarUrl: string | null;
  role: UserRole;
  locale: string;
  createdAt: ISODateString;
}

export interface AgentSummary {
  id: UUID;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  title: string | null;
  isVerified: boolean;
  agencyName: string | null;
  agencySlug: string | null;
  whatsapp: string | null;
  phone: string | null;
  responseTimeMinutes: number | null;
  languages: string[];
  areas: string[];
  activeListings: number;
  ratingAverage: number | null;
  ratingCount: number;
}

export interface Agent extends AgentSummary {
  bio: string | null;
  email: string | null;
  coverImageUrl: string | null;
  yearsExperience: number | null;
  socialLinks: Partial<Record<"instagram" | "facebook" | "linkedin" | "website", string>>;
  joinedAt: ISODateString;
}

export interface AgencySummary {
  id: UUID;
  slug: string;
  name: string;
  logoUrl: string | null;
  isVerified: boolean;
  city: string | null;
  activeListings: number;
  projectCount: number;
  agentCount: number;
}

export interface Agency extends AgencySummary {
  description: string | null;
  coverImageUrl: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  areas: string[];
  socialLinks: Partial<Record<"instagram" | "facebook" | "tiktok" | "youtube" | "linkedin", string>>;
  foundedYear: number | null;
  createdAt: ISODateString;
}

export interface DeveloperSummary {
  id: UUID;
  slug: string;
  name: string;
  logoUrl: string | null;
  isVerified: boolean;
  projectCount: number;
  deliveredUnits: number;
}

export interface Developer extends DeveloperSummary {
  description: string | null;
  coverImageUrl: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  foundedYear: number | null;
  areas: string[];
}

export interface OrgMembership {
  organizationId: UUID;
  organizationType: "agency" | "developer";
  organizationName: string;
  role: OrgMemberRole;
  status: "active" | "invited" | "suspended";
}

/** Sesión resuelta del usuario para guards y UI. */
export interface SessionUser {
  id: UUID;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
  memberships: OrgMembership[];
  agentId: UUID | null;
}
