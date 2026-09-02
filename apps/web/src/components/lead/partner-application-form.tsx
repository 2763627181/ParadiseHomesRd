"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import {
  INVENTORY_SIZE,
  PARTNER_TYPE,
  PARTNER_TYPE_LABELS,
  partnerApplicationSchema,
  type PartnerApplicationInput,
  type PartnerApplicationValues,
} from "@paradise/validation";

import { submitPartnerApplication } from "@/lib/actions/partner";
import { analytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PartnerApplicationForm() {
  const [done, setDone] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const form = useForm<PartnerApplicationInput, unknown, PartnerApplicationValues>({
    resolver: zodResolver(partnerApplicationSchema),
    defaultValues: {
      companyName: "",
      partnerType: "agency",
      contactName: "",
      email: "",
      phone: "",
      whatsapp: "",
      website: "",
      instagram: "",
      inventorySize: "1-10",
      locations: [],
      message: "",
      consent: false,
      website_hp: "",
    },
  });

  const [locationsInput, setLocationsInput] = React.useState("");

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await submitPartnerApplication({
      ...values,
      locations: locationsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
    if (result.ok) {
      analytics.track("lead_created", { props: { channel: "partner_application" } });
      setDone(true);
      return;
    }
    if (result.fieldErrors) {
      for (const [k, m] of Object.entries(result.fieldErrors)) {
        form.setError(k as keyof PartnerApplicationInput, { message: m });
      }
    }
    setFormError(result.message ?? "No pudimos enviar la solicitud.");
  });

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2Icon className="size-9 text-verified" />
        <p className="text-lg font-medium">¡Solicitud recibida!</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Nuestro equipo revisará tu información y te contactará pronto.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="text" tabIndex={-1} className="hidden" {...form.register("website_hp")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Empresa" error={form.formState.errors.companyName?.message}>
          <Input {...form.register("companyName")} placeholder="Nombre de la empresa" />
        </Field>
        <Field label="Tipo">
          <Select
            value={form.watch("partnerType")}
            onValueChange={(v) => form.setValue("partnerType", v as PartnerApplicationInput["partnerType"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTNER_TYPE.options.map((type) => (
                <SelectItem key={type} value={type}>
                  {PARTNER_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre de contacto" error={form.formState.errors.contactName?.message}>
          <Input {...form.register("contactName")} />
        </Field>
        <Field label="Correo" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono" error={form.formState.errors.phone?.message}>
          <Input inputMode="tel" {...form.register("phone")} placeholder="809-123-4567" />
        </Field>
        <Field label="WhatsApp (opcional)">
          <Input inputMode="tel" {...form.register("whatsapp")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sitio web (opcional)">
          <Input {...form.register("website")} placeholder="https://" />
        </Field>
        <Field label="Instagram (opcional)">
          <Input {...form.register("instagram")} placeholder="@tuempresa" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cantidad de propiedades">
          <Select
            value={form.watch("inventorySize")}
            onValueChange={(v) => form.setValue("inventorySize", v as PartnerApplicationInput["inventorySize"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INVENTORY_SIZE.options.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Zonas donde operas"
          error={form.formState.errors.locations?.message}
        >
          <Input
            value={locationsInput}
            onChange={(e) => setLocationsInput(e.target.value)}
            placeholder="Piantini, Punta Cana, Santiago…"
          />
        </Field>
      </div>

      <Field label="Mensaje (opcional)">
        <textarea
          rows={3}
          className="flex w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          {...form.register("message")}
        />
      </Field>

      <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
        <Checkbox
          className="mt-0.5"
          checked={form.watch("consent")}
          onCheckedChange={(v) => form.setValue("consent", Boolean(v), { shouldValidate: true })}
        />
        Acepto que Paradise Homes RD me contacte sobre esta solicitud.
      </label>
      {form.formState.errors.consent && (
        <p className="text-xs text-destructive">{form.formState.errors.consent.message}</p>
      )}
      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
        Enviar solicitud
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
