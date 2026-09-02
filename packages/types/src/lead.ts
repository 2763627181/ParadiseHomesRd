import type {
  CommissionStatus,
  Currency,
  LeadChannel,
  LeadSource,
  LeadStatus,
  VisitStatus,
} from "@paradise/config";
import type { AttributionSnapshot } from "@paradise/utils/attribution";
import type { ISODateString, UUID } from "./common";

export interface Contact {
  id: UUID;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  createdAt: ISODateString;
  leadCount: number;
}

export interface Lead {
  id: UUID;
  leadCode: string;
  contactId: UUID;
  contact: Pick<Contact, "fullName" | "email" | "phone" | "whatsapp">;
  propertyId: UUID | null;
  propertyCode: string | null;
  propertyTitle: string | null;
  projectId: UUID | null;
  unitId: UUID | null;
  agentId: UUID | null;
  agentName: string | null;
  agencyId: UUID | null;
  developerId: UUID | null;
  source: LeadSource;
  channel: LeadChannel;
  status: LeadStatus;
  message: string | null;
  attribution: AttributionSnapshot | null;
  campaign: string | null;
  nextActivityAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface LeadActivity {
  id: UUID;
  leadId: UUID;
  type:
    | "lead_created"
    | "assigned"
    | "status_changed"
    | "note_added"
    | "whatsapp_sent"
    | "contacted"
    | "client_replied"
    | "visit_scheduled"
    | "visit_completed"
    | "email_sent";
  title: string;
  body: string | null;
  actorId: UUID | null;
  actorName: string | null;
  metadata: Record<string, unknown>;
  occurredAt: ISODateString;
}

export interface LeadNote {
  id: UUID;
  leadId: UUID;
  authorId: UUID;
  authorName: string;
  body: string;
  createdAt: ISODateString;
}

export interface Visit {
  id: UUID;
  visitCode: string;
  leadId: UUID;
  propertyId: UUID | null;
  unitId: UUID | null;
  propertyTitle: string | null;
  clientName: string;
  agentId: UUID | null;
  agentName: string | null;
  scheduledAt: ISODateString | null;
  status: VisitStatus;
  notes: string | null;
  createdAt: ISODateString;
}

export interface Closing {
  id: UUID;
  closingCode: string;
  leadId: UUID | null;
  propertyId: UUID | null;
  unitId: UUID | null;
  closingAmount: number;
  currency: Currency;
  partnerName: string | null;
  agentId: UUID | null;
  closedAt: ISODateString;
  createdAt: ISODateString;
}

export interface Commission {
  id: UUID;
  commissionCode: string;
  closingId: UUID;
  amount: number;
  currency: Currency;
  status: CommissionStatus;
  notes: string | null;
  createdAt: ISODateString;
}

/** Lead agrupado en el pipeline visual. */
export interface LeadPipelineColumn {
  status: LeadStatus;
  label: string;
  leads: Lead[];
  total: number;
}
