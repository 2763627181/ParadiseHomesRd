"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { cancelVisit } from "@/lib/actions/visits";
import { Button } from "@/components/ui/button";
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

/**
 * Botón "Cancelar" con diálogo de confirmación y motivo opcional. Lo usan tanto
 * la agenda del asesor como la tabla de visitas del cliente (Server Component).
 */
export function CancelVisitButton({
  visitId,
  label = "Cancelar",
  description = "La visita quedará cancelada y se avisará a la otra parte. Esta acción no se puede deshacer.",
  className,
}: {
  visitId: string;
  label?: string;
  description?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const confirm = async () => {
    setPending(true);
    const res = await cancelVisit(visitId, reason || undefined);
    setPending(false);
    if (res.ok) {
      toast.success("Visita cancelada");
      setOpen(false);
      setReason("");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo cancelar la visita");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!pending ? setOpen(o) : null)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={className ?? "text-destructive hover:text-destructive"}
        >
          <XIcon className="size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar la visita?</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-1.5">
          <Label htmlFor={`cancel-visit-reason-${visitId}`}>Motivo (opcional)</Label>
          <Textarea
            id={`cancel-visit-reason-${visitId}`}
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. surgió un imprevisto, reprogramaremos…"
            disabled={pending}
          />
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Volver
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            Sí, cancelar visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
