"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { leadFormSchema, type LeadFormInput, type LeadFormValues } from "@paradise/validation";

type LeadFormChannel = "property_form" | "whatsapp" | "phone" | "schedule_visit" | "contact_page";

import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { submitLead } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface LeadFormProps {
  propertyId?: string;
  propertyCode?: string;
  projectId?: string;
  unitId?: string;
  agentId?: string;
  agencyId?: string;
  channel?: LeadFormChannel;
  intent?: "info" | "visit" | "financing" | "callback";
  defaultMessage?: string;
  compact?: boolean;
  onSuccess?: (leadCode: string) => void;
}

export function LeadForm({
  propertyId,
  propertyCode,
  projectId,
  unitId,
  agentId,
  agencyId,
  channel = "property_form",
  intent = "info",
  defaultMessage,
  compact = false,
  onSuccess,
}: LeadFormProps) {
  const [done, setDone] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<LeadFormInput, unknown, LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      message: defaultMessage ?? "",
      intent,
      channel,
      propertyId,
      propertyCode,
      projectId,
      unitId,
      agentId,
      agencyId,
      consent: false,
      website: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await submitLead(values);
    if (result.ok && result.leadCode) {
      analytics.track("lead_created", {
        propertyId,
        projectId,
        agentId,
        agencyId,
        props: { channel, intent, leadCode: result.leadCode },
      });
      setDone(result.leadCode);
      onSuccess?.(result.leadCode);
      return;
    }
    if (result.fieldErrors) {
      for (const [key, message] of Object.entries(result.fieldErrors)) {
        form.setError(key as keyof LeadFormInput, { message });
      }
    }
    setFormError(result.message ?? "No pudimos enviar tu solicitud.");
  });

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-verified/25 bg-verified/5 p-6 text-center">
        <CheckCircle2Icon className="size-8 text-verified" />
        <p className="font-medium">¡Solicitud enviada!</p>
        <p className="text-sm text-muted-foreground">
          El asesor te contactará pronto. Tu referencia es <strong>{done}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-3", compact && "space-y-2.5")}>
      <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...form.register("website")} />

      <div className="space-y-1.5">
        <Label htmlFor="lead-name">Nombre completo</Label>
        <Input id="lead-name" placeholder="Tu nombre" {...form.register("fullName")} aria-invalid={!!form.formState.errors.fullName} />
        {form.formState.errors.fullName && (
          <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lead-phone">Teléfono / WhatsApp</Label>
          <Input
            id="lead-phone"
            inputMode="tel"
            placeholder="809-123-4567"
            {...form.register("phone")}
            aria-invalid={!!form.formState.errors.phone}
          />
          {form.formState.errors.phone && (
            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-email">Correo (opcional)</Label>
          <Input id="lead-email" type="email" placeholder="tu@correo.com" {...form.register("email")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lead-message">Mensaje</Label>
        <textarea
          id="lead-message"
          rows={compact ? 2 : 3}
          className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-xs outline-none placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          {...form.register("message")}
        />
      </div>

      <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
        <Checkbox
          className="mt-0.5"
          checked={form.watch("consent")}
          onCheckedChange={(v) => form.setValue("consent", Boolean(v), { shouldValidate: true })}
        />
        <span>
          Acepto que Paradise Homes RD y el asesor de esta propiedad me contacten. Consulta la{" "}
          <a href="/privacy" className="underline underline-offset-2">
            política de privacidad
          </a>
          .
        </span>
      </label>
      {form.formState.errors.consent && (
        <p className="text-xs text-destructive">{form.formState.errors.consent.message}</p>
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
        Solicitar información
      </Button>
    </form>
  );
}
