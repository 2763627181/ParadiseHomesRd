"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheckIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react";
import {
  scheduleVisitSchema,
  type ScheduleVisitInput,
  type ScheduleVisitValues,
} from "@paradise/validation";

import { analytics } from "@/lib/analytics";
import { submitVisitRequest } from "@/lib/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const SLOTS = [
  { value: "morning", label: "Mañana" },
  { value: "afternoon", label: "Tarde" },
  { value: "evening", label: "Noche" },
] as const;

export function ScheduleVisitDialog({
  open,
  onOpenChange,
  propertyId,
  propertyCode,
  unitId,
  projectId,
  agentId,
  propertyTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  propertyCode?: string;
  unitId?: string;
  projectId?: string;
  agentId?: string;
  propertyTitle?: string;
}) {
  const [done, setDone] = React.useState(false);
  const minDate = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

  const form = useForm<ScheduleVisitInput, unknown, ScheduleVisitValues>({
    resolver: zodResolver(scheduleVisitSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      preferredDate: minDate,
      preferredTimeSlot: "morning",
      notes: "",
      propertyId,
      propertyCode,
      unitId,
      projectId,
      agentId,
      consent: false,
      website: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await submitVisitRequest(values);
    if (result.ok) {
      analytics.track("visit_requested", { propertyId, projectId, agentId });
      setDone(true);
      return;
    }
    if (result.fieldErrors) {
      for (const [k, m] of Object.entries(result.fieldErrors)) {
        form.setError(k as keyof ScheduleVisitInput, { message: m });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheckIcon className="size-5" />
            Agendar visita
          </DialogTitle>
          <DialogDescription>
            {propertyTitle ?? "Coordina una visita con el asesor."}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2Icon className="size-8 text-verified" />
            <p className="font-medium">Solicitud enviada</p>
            <p className="text-sm text-muted-foreground">
              El asesor confirmará la fecha contigo por WhatsApp.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input type="text" tabIndex={-1} className="hidden" {...form.register("website")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="visit-name">Nombre</Label>
                <Input id="visit-name" {...form.register("fullName")} />
                {form.formState.errors.fullName && (
                  <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visit-phone">Teléfono</Label>
                <Input id="visit-phone" inputMode="tel" {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="visit-date">Fecha preferida</Label>
                <Input id="visit-date" type="date" min={minDate} {...form.register("preferredDate")} />
              </div>
              <div className="space-y-1.5">
                <Label>Horario</Label>
                <div className="flex gap-1 rounded-lg bg-secondary p-1">
                  {SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => form.setValue("preferredTimeSlot", slot.value)}
                      className={
                        "flex-1 rounded-md px-2 py-1.5 text-sm font-medium transition-colors " +
                        (form.watch("preferredTimeSlot") === slot.value
                          ? "bg-background shadow-xs"
                          : "text-muted-foreground")
                      }
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
              <Checkbox
                className="mt-0.5"
                checked={form.watch("consent")}
                onCheckedChange={(v) => form.setValue("consent", Boolean(v), { shouldValidate: true })}
              />
              Acepto ser contactado para coordinar la visita.
            </label>
            {form.formState.errors.consent && (
              <p className="text-xs text-destructive">{form.formState.errors.consent.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
              Enviar solicitud
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
