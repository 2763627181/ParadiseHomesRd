import { z } from "zod";

export const fullNameSchema = z
  .string({ error: "Ingresa tu nombre" })
  .trim()
  .min(2, "Ingresa tu nombre completo")
  .max(120, "El nombre es demasiado largo");

export const emailSchema = z
  .string({ error: "Ingresa tu correo" })
  .trim()
  .toLowerCase()
  .pipe(z.email("Correo no válido"));

export const optionalEmailSchema = z
  .union([z.literal(""), emailSchema])
  .transform((v) => (v === "" ? undefined : v))
  .optional();

/**
 * Teléfono de República Dominicana. Acepta formatos con o sin +1, espacios y
 * guiones. Normaliza a 10 dígitos (sin código de país) o 11 con "1".
 */
export const phoneDoSchema = z
  .string({ error: "Ingresa tu teléfono" })
  .trim()
  .transform((value) => value.replace(/[\s()\-.]/g, ""))
  .refine(
    (value) => /^(\+?1)?(8[024]9)\d{7}$/.test(value),
    "Número dominicano no válido (ej. 809-123-4567)",
  )
  .transform((value) => value.replace(/^\+?1/, ""));

export const optionalPhoneDoSchema = z
  .union([z.literal(""), phoneDoSchema])
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const messageSchema = z
  .string()
  .trim()
  .max(1500, "El mensaje es demasiado largo")
  .optional();

export const urlSchema = z
  .union([z.literal(""), z.url("Enlace no válido")])
  .transform((v) => (v === "" ? undefined : v))
  .optional();

export const currencySchema = z.enum(["USD", "DOP"]);
export const operationTypeSchema = z.enum(["SALE", "RENT"]);
export const propertyTypeSchema = z.enum([
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "PENTHOUSE",
  "LOT",
  "LAND",
  "COMMERCIAL",
  "OFFICE",
]);
export const conditionStatusSchema = z.enum([
  "NEW",
  "USED",
  "OFF_PLAN",
  "UNDER_CONSTRUCTION",
  "READY_TO_MOVE",
]);

/** Snapshot de atribución adjunto a payloads públicos (validado laxo: viene del cliente). */
export const attributionInputSchema = z
  .object({
    utmSource: z.string().max(200).optional(),
    utmMedium: z.string().max(200).optional(),
    utmCampaign: z.string().max(200).optional(),
    utmContent: z.string().max(200).optional(),
    utmTerm: z.string().max(200).optional(),
    gclid: z.string().max(200).optional(),
    fbclid: z.string().max(200).optional(),
    ttclid: z.string().max(200).optional(),
    referrer: z.string().max(500).optional(),
    landingPage: z.string().max(500).optional(),
  })
  .partial()
  .optional();

export const consentSchema = z
  .boolean()
  .refine((v) => v === true, "Debes aceptar para continuar");

/** Honeypot anti-spam: debe venir vacío. */
export const honeypotSchema = z.string().max(0, "Envío no válido").optional();
