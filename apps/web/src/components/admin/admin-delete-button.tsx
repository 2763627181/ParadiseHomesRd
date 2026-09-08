"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  deleteAgency,
  deleteAgent,
  deleteDeveloper,
  deleteProject,
  deleteProperty,
  type AdminActionResult,
} from "@/lib/actions/admin-entities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Kind = "property" | "project" | "agency" | "agent" | "developer";

const ACTIONS: Record<Kind, (id: string) => Promise<AdminActionResult>> = {
  property: deleteProperty,
  project: deleteProject,
  agency: deleteAgency,
  agent: deleteAgent,
  developer: deleteDeveloper,
};

const CONSEQUENCE: Record<Kind, string> = {
  property: "Se eliminan también sus fotos. Los leads asociados se conservan sin propiedad.",
  project: "Se eliminan sus unidades y planes de pago. Las propiedades ligadas quedan sin proyecto.",
  agency: "Sus agentes y propiedades no se borran: quedan sin inmobiliaria asignada.",
  agent: "Sus propiedades y leads no se borran: quedan sin agente asignado.",
  developer: "Sus proyectos y propiedades no se borran: quedan sin desarrolladora asignada.",
};

export function AdminDeleteButton({
  kind,
  id,
  name,
  redirectTo,
}: {
  kind: Kind;
  id: string;
  name: string;
  /** Si se pasa, navega ahí tras eliminar (útil desde una página de detalle). */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const confirm = async () => {
    setBusy(true);
    const res = await ACTIONS[kind](id);
    setBusy(false);
    if (res.ok) {
      toast.success(`«${name}» eliminado`);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo eliminar");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        title="Eliminar"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar «{name}»</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción no se puede deshacer. {CONSEQUENCE[kind]}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirm} disabled={busy}>
              {busy ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
