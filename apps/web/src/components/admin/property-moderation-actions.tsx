"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";

import { approveProperty, rejectProperty, unpublishProperty } from "@/lib/actions/moderation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PropertyModerationActions({
  propertyId,
  status,
  title,
}: {
  propertyId: string;
  status: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const run = async (fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      toast.success("Actualizado");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo actualizar");
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {status !== "PUBLISHED" && (
          <Button onClick={() => run(() => approveProperty(propertyId))} disabled={busy}>
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
            Aprobar y publicar
          </Button>
        )}
        {status === "PENDING_REVIEW" && (
          <Button
            variant="outline"
            onClick={() => {
              setReason("");
              setRejectOpen(true);
            }}
            disabled={busy}
          >
            <XIcon className="size-4" />
            Rechazar
          </Button>
        )}
        {status === "PUBLISHED" && (
          <Button
            variant="outline"
            onClick={() => run(() => unpublishProperty(propertyId))}
            disabled={busy}
          >
            Despublicar
          </Button>
        )}
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar «{title}»</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Motivo (se guarda en el historial y le llega a quien publicó para corregir)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || busy}
              onClick={async () => {
                await run(() => rejectProperty(propertyId, reason));
                setRejectOpen(false);
              }}
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
