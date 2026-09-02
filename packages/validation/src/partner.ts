import { z } from "zod";
import {
  consentSchema,
  emailSchema,
  fullNameSchema,
  honeypotSchema,
  optionalPhoneDoSchema,
  phoneDoSchema,
  urlSchema,
} from "./primitives.js";

export const PARTNER_TYPE = z.enum([
  "agency",
  "developer",
  "construction",
  "broker",
  "owner",
]);

export const PARTNER_TYPE_LABELS: Record<z.infer<typeof PARTNER_TYPE>, string> = {
  agency: "Inmobiliaria",
  developer: "Desarrolladora",
  construction: "Constructora",
  broker: "Broker independiente",
  owner: "Propietario",
};

export const INVENTORY_SIZE = z.enum(["1-10", "11-50", "51-200", "200+"]);

/** Formulario `/partners/apply`. */
export const partnerApplicationSchema = z.object({
  companyName: z.string().trim().min(2, "Ingresa el nombre de la empresa").max(160),
  partnerType: PARTNER_TYPE,
  contactName: fullNameSchema,
  email: emailSchema,
  phone: phoneDoSchema,
  whatsapp: optionalPhoneDoSchema,
  website: urlSchema,
  instagram: z.string().trim().max(120).optional(),
  inventorySize: INVENTORY_SIZE,
  locations: z
    .array(z.string().trim().min(1))
    .min(1, "Indica al menos una zona donde operas")
    .max(20),
  message: z.string().trim().max(1500).optional(),
  consent: consentSchema,
  website_hp: honeypotSchema,
});

export type PartnerApplicationInput = z.input<typeof partnerApplicationSchema>;
export type PartnerApplicationValues = z.output<typeof partnerApplicationSchema>;
