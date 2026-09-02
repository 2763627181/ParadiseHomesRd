import { z } from "zod";
import {
  conditionStatusSchema,
  currencySchema,
  emailSchema,
  fullNameSchema,
  operationTypeSchema,
  optionalPhoneDoSchema,
  phoneDoSchema,
  propertyTypeSchema,
} from "./primitives";

/**
 * Wizard `/list-property` — 8 pasos. Cada paso valida su parte; el submit final
 * valida el objeto completo. `listPropertyDraftSchema` es todo opcional para el
 * autosave del borrador.
 */

// 1. Tipo
export const stepTypeSchema = z.object({
  operationType: operationTypeSchema,
  propertyType: propertyTypeSchema,
  conditionStatus: conditionStatusSchema,
});

// 2. Ubicación
export const stepLocationSchema = z.object({
  provinceSlug: z.string().min(1, "Selecciona la provincia"),
  citySlug: z.string().min(1, "Selecciona el municipio"),
  sectorSlug: z.string().min(1).optional(),
  address: z.string().trim().max(240).optional(),
  latitude: z.number().min(17).max(20).optional(),
  longitude: z.number().min(-72.5).max(-68).optional(),
  hideExactLocation: z.boolean().default(false),
});

// 3. Información
export const stepInfoSchema = z.object({
  title: z.string().trim().min(8, "El título es muy corto").max(120),
  description: z.string().trim().min(40, "Describe la propiedad (mín. 40 caracteres)").max(5000),
  bedrooms: z.number().int().min(0).max(30).optional(),
  bathrooms: z.number().min(0).max(30).optional(),
  parkingSpaces: z.number().int().min(0).max(30).optional(),
  constructionM2: z.number().positive().max(100000).optional(),
  landM2: z.number().positive().max(10000000).optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 6)
    .optional(),
  floor: z.number().int().min(-5).max(200).optional(),
  totalFloors: z.number().int().min(1).max(200).optional(),
});

// 4. Precio
export const stepPriceObject = z.object({
  priceOnRequest: z.boolean().default(false),
  price: z.number().positive("Ingresa un precio válido").max(500_000_000).optional(),
  currency: currencySchema.default("USD"),
  maintenanceFee: z.number().min(0).max(1_000_000).optional(),
  maintenanceFeeCurrency: currencySchema.optional(),
  deliveryDate: z.iso.date().optional(),
});

const requirePrice = (v: { priceOnRequest?: boolean; price?: number }) =>
  Boolean(v.priceOnRequest) || typeof v.price === "number";

export const stepPriceSchema = stepPriceObject.refine(requirePrice, {
  error: "Ingresa el precio o marca «Precio a consultar»",
  path: ["price"],
});

// 5. Características
export const stepFeaturesSchema = z.object({
  amenityKeys: z.array(z.string()).max(60).default([]),
  furnished: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  airbnbFriendly: z.boolean().default(false),
});

// 6. Multimedia
export const stepMediaSchema = z.object({
  images: z
    .array(
      z.object({
        storagePath: z.string().min(1),
        url: z.string().min(1),
        position: z.number().int().min(0),
        isCover: z.boolean().default(false),
        alt: z.string().max(160).optional(),
      }),
    )
    .min(1, "Sube al menos una foto")
    .max(40, "Máximo 40 fotos"),
  videoUrl: z
    .union([z.literal(""), z.url()])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
  virtualTourUrl: z
    .union([z.literal(""), z.url()])
    .transform((v) => (v === "" ? undefined : v))
    .optional(),
});

// 7. Contacto
export const stepContactSchema = z.object({
  contactName: fullNameSchema,
  contactPhone: phoneDoSchema,
  contactWhatsapp: optionalPhoneDoSchema,
  contactEmail: emailSchema,
  agencyId: z.uuid().optional(),
  agentId: z.uuid().optional(),
});

// 8. Review (submit final)
export const listPropertyObject = z.object({
  ...stepTypeSchema.shape,
  ...stepLocationSchema.shape,
  ...stepInfoSchema.shape,
  ...stepPriceObject.shape,
  ...stepFeaturesSchema.shape,
  ...stepMediaSchema.shape,
  ...stepContactSchema.shape,
  acceptTerms: z.literal(true, { error: "Debes aceptar los términos" }),
});

export const listPropertySchema = listPropertyObject.refine(requirePrice, {
  error: "Ingresa el precio o marca «Precio a consultar»",
  path: ["price"],
});

export type ListPropertyValues = z.output<typeof listPropertySchema>;

/** Autosave: todo parcial. */
export const listPropertyDraftSchema = listPropertyObject.partial().extend({
  draftId: z.uuid().optional(),
  currentStep: z.number().int().min(1).max(8).default(1),
});

export type ListPropertyDraft = z.output<typeof listPropertyDraftSchema>;

export const LIST_PROPERTY_STEPS = [
  { key: "type", title: "Tipo", schema: stepTypeSchema },
  { key: "location", title: "Ubicación", schema: stepLocationSchema },
  { key: "info", title: "Información", schema: stepInfoSchema },
  { key: "price", title: "Precio", schema: stepPriceSchema },
  { key: "features", title: "Características", schema: stepFeaturesSchema },
  { key: "media", title: "Multimedia", schema: stepMediaSchema },
  { key: "contact", title: "Contacto", schema: stepContactSchema },
  { key: "review", title: "Revisión", schema: z.object({}) },
] as const;
