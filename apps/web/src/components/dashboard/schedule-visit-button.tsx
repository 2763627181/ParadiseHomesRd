"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlusIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { createVisitForLead } from "@/lib/actions/visits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Agenda una visita para un lead desde el detalle del lead. Autocontenido. */
export function ScheduleVisitButton({
  leadId,
  size = "sm",
  variant = "outline",
  className,
}: {
  leadId: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [when, setWhen] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await createVisitForLead(leadId, when || null, notes || undefined);
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Visita creada");
      setOpen(false);
      setWhen("");
      setNotes("");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo crear la visita");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
      <DialogTrigger asChild>
        <Button type="button" size={size} variant={variant} className={className}>
          <CalendarPlusIcon className="size-4" />
          Agendar visita
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Agendar visita</DialogTitle>
            <DialogDescription>
              Si dejas la fecha vacía, la visita queda como “por confirmar”. Al poner fecha se avisa al cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="visit-when">Fecha y hora (opcional)</Label>
              <Input
                id="visit-when"
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="visit-notes">Notas (opcional)</Label>
              <Textarea
                id="visit-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. punto de encuentro, quién asiste…"
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
