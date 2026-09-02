import { z } from "zod";
import {
  attributionInputSchema,
  consentSchema,
  emailSchema,
  fullNameSchema,
  honeypotSchema,
  messageSchema,
  optionalEmailSchema,
  phoneDoSchema,
} from "./primitives.js";

export const LEAD_INTENT = z.enum(["info", "visit", "financing", "callback"]);

/**
 * Formulario "Solicitar información" desde una propiedad o proyecto.
 * Se envía a `/api/leads` o a una Server Action. La atribución se inyecta
 * server-side desde la cookie; el campo aquí es un respaldo.
 */
export const leadFormSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneDoSchema,
  email: optionalEmailSchema,
  message: messageSchema,
  intent: LEAD_INTENT.default("info"),

  // Contexto (uno de property/project/unit)
  propertyId: z.uuid().optional(),
  propertyCode: z.string().max(24).optional(),
  projectId: z.uuid().optional(),
  unitId: z.uuid().optional(),
  agentId: z.uuid().optional(),
  agencyId: z.uuid().optional(),

  channel: z
    .enum(["property_form", "whatsapp", "phone", "schedule_visit", "contact_page"])
    .default("property_form"),

  consent: consentSchema,
  attribution: attributionInputSchema,
  website: honeypotSchema,
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormValues = z.output<typeof leadFormSchema>;

export const scheduleVisitSchema = z.object({
  fullName: fullNameSchema,
  phone: phoneDoSchema,
  email: optionalEmailSchema,
  propertyId: z.uuid().optional(),
  propertyCode: z.string().max(24).optional(),
  unitId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  agentId: z.uuid().optional(),
  /** fecha ISO (día) elegida por el usuario */
  preferredDate: z.iso.date("Elige una fecha"),
  preferredTimeSlot: z.enum(["morning", "afternoon", "evening"], {
    error: "Elige un horario",
  }),
  notes: messageSchema,
  consent: consentSchema,
  attribution: attributionInputSchema,
  website: honeypotSchema,
});

export type ScheduleVisitInput = z.input<typeof scheduleVisitSchema>;
export type ScheduleVisitValues = z.output<typeof scheduleVisitSchema>;

/** Nota interna de un agente sobre un lead. */
export const leadNoteSchema = z.object({
  leadId: z.uuid(),
  body: z.string().trim().min(1, "Escribe una nota").max(2000),
});

/** Cambio de estado del lead en el pipeline. */
export const leadStatusUpdateSchema = z.object({
  leadId: z.uuid(),
  status: z.enum([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "VISIT_SCHEDULED",
    "VISIT_COMPLETED",
    "NEGOTIATING",
    "RESERVED",
    "CLOSED_WON",
    "CLOSED_LOST",
  ]),
  nextActivityAt: z.iso.datetime().optional(),
  note: z.string().trim().max(2000).optional(),
});

export const leadAssignmentSchema = z.object({
  leadId: z.uuid(),
  agentId: z.uuid(),
});

/** Contacto genérico desde `/contact`. */
export const contactFormSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(2, "Asunto muy corto").max(150),
  message: z.string().trim().min(10, "Cuéntanos un poco más").max(2000),
  consent: consentSchema,
  website: honeypotSchema,
});

export type ContactFormValues = z.output<typeof contactFormSchema>;
