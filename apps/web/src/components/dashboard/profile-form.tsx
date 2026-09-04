"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import type { z } from "zod";
import { updateProfileSchema } from "@paradise/validation";

import { updateProfile } from "@/lib/actions/customer";
import type { CustomerProfile } from "@/lib/data/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// z.input (no z.output): `locale` tiene `.default("es")`, así que en el input
// del formulario es opcional — coincide con lo que espera `zodResolver`.
type ProfileFormValues = z.input<typeof updateProfileSchema>;

export function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const [success, setSuccess] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: profile.fullName,
      phone: profile.phone ?? "",
      whatsapp: profile.whatsapp ?? "",
      locale: "es",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSuccess(null);
    setFormError(null);
    const result = await updateProfile(values);
    if (result.fieldErrors) {
      for (const [k, m] of Object.entries(result.fieldErrors)) {
        form.setError(k as keyof ProfileFormValues, { message: m });
      }
    }
    if (!result.ok) {
      setFormError(result.message ?? "No pudimos actualizar tu perfil.");
      return;
    }
    setSuccess(result.message ?? "Perfil actualizado.");
  });

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="profile-email">Correo</Label>
        <Input id="profile-email" value={profile.email ?? ""} disabled readOnly />
        <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="profile-name">Nombre completo</Label>
        <Input id="profile-name" autoComplete="name" {...form.register("fullName")} />
        {form.formState.errors.fullName && (
          <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="profile-phone">Teléfono</Label>
          <Input
            id="profile-phone"
            inputMode="tel"
            placeholder="809-123-4567"
            {...form.register("phone")}
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="profile-whatsapp">WhatsApp</Label>
          <Input
            id="profile-whatsapp"
            inputMode="tel"
            placeholder="809-123-4567"
            {...form.register("whatsapp")}
          />
          {form.formState.errors.whatsapp && (
            <p className="text-xs text-destructive">{form.formState.errors.whatsapp.message}</p>
          )}
        </div>
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}
      {success && (
        <p className="flex items-center gap-1.5 text-sm text-verified">
          <CheckCircle2Icon className="size-4" />
          {success}
        </p>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
        Guardar cambios
      </Button>
    </form>
  );
}
