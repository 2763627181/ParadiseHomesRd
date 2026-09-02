import { z } from "zod";
import { emailSchema, fullNameSchema, optionalPhoneDoSchema } from "./primitives";

export const passwordSchema = z
  .string({ error: "Ingresa tu contraseña" })
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Ingresa tu contraseña"),
  next: z.string().startsWith("/").max(300).optional(),
});

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    phone: optionalPhoneDoSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, "Debes aceptar los términos y la política de privacidad"),
    next: z.string().startsWith("/").max(300).optional(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
  phone: optionalPhoneDoSchema,
  whatsapp: optionalPhoneDoSchema,
  locale: z.enum(["es", "en"]).default("es"),
  avatarUrl: z.url().optional(),
});

export type LoginValues = z.output<typeof loginSchema>;
export type RegisterValues = z.output<typeof registerSchema>;
export type UpdateProfileValues = z.output<typeof updateProfileSchema>;
