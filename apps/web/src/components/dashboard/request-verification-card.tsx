"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheckIcon, Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { requestVerification } from "@/lib/actions/request-verification";
import { Button } from "@/components/ui/button";

export function RequestVerificationCard({
  targetType,
  targetId,
  isVerified,
  pending = false,
}: {
  targetType: "agent" | "agency" | "developer";
  targetId: string;
  isVerified: boolean;
  /** ya hay una solicitud PENDING registrada */
  pending?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [requested, setRequested] = React.useState(pending);

  if (isVerified) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-verified/30 bg-verified/5 p-4">
        <BadgeCheckIcon className="size-5 shrink-0 text-verified" />
        <div>
          <p className="text-sm font-medium text-foreground">Paradise Verified</p>
          <p className="text-xs text-muted-foreground">Tu perfil ya aparece con el sello de verificación.</p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    setBusy(true);
    const res = await requestVerification(targetType, targetId);
    setBusy(false);
    if (res.ok) {
      setRequested(true);
      toast.success(res.message ?? "Solicitud enviada");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo enviar la solicitud");
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start gap-3">
        <ShieldCheckIcon className="size-5 shrink-0 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">Verificación Paradise</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            El sello Paradise Verified genera más confianza y mejor posición en el directorio. El equipo
            revisa tu identidad y tu actividad antes de otorgarlo.
          </p>
          {requested ? (
            <p className="mt-3 text-xs font-medium text-warning-foreground">
              Solicitud pendiente de revisión.
            </p>
          ) : (
            <Button size="sm" className="mt-3" onClick={submit} disabled={busy}>
              {busy ? <Loader2Icon className="size-4 animate-spin" /> : <ShieldCheckIcon className="size-4" />}
              Solicitar verificación
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
