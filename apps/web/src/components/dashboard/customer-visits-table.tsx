import Link from "next/link";
import { CalendarIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";
import { formatVisitDateRd, formatTimeRd } from "@paradise/utils/datetime";
import { ROUTES, type VisitStatus } from "@paradise/config";

import type { CustomerVisit } from "@/lib/data/customer";
import { Badge } from "@/components/ui/badge";
import { CancelVisitButton } from "@/components/dashboard/cancel-visit-button";

const VISIT_STATUS_LABELS_ES: Record<VisitStatus, string> = {
  REQUESTED: "Solicitada",
  SCHEDULED: "Agendada",
  COMPLETED: "Realizada",
  NO_SHOW: "No asistió",
  CANCELLED: "Cancelada",
};

const VISIT_STATUS_VARIANT: Record<VisitStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  REQUESTED: "warning",
  SCHEDULED: "default",
  COMPLETED: "success",
  NO_SHOW: "destructive",
  CANCELLED: "destructive",
};

/** Lista de solo lectura de las visitas agendadas para el propio usuario. */
export function CustomerVisitsTable({ visits }: { visits: CustomerVisit[] }) {
  if (visits.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No tienes visitas agendadas todavía.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {visits.map((visit) => (
        <div key={visit.id} className="rounded-xl border border-border/70 bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              {visit.propertyTitle ? (
                visit.propertySlug ? (
                  <Link href={ROUTES.property(visit.propertySlug)} className="font-medium hover:underline">
                    {visit.propertyTitle}
                  </Link>
                ) : (
                  <p className="font-medium">{visit.propertyTitle}</p>
                )
              ) : (
                <p className="font-medium">Propiedad</p>
              )}
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="size-3.5" />
                {visit.scheduledAt
                  ? `${formatVisitDateRd(visit.scheduledAt)} · ${formatTimeRd(visit.scheduledAt)}`
                  : "Sin fecha confirmada"}
              </p>
            </div>
            <Badge variant={VISIT_STATUS_VARIANT[visit.status]}>{VISIT_STATUS_LABELS_ES[visit.status]}</Badge>
          </div>

          {visit.notes && (
            <p className="mt-3 line-clamp-2 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
              {visit.notes}
            </p>
          )}

          {(visit.status === "REQUESTED" || visit.status === "SCHEDULED") && (
            <div className="mt-3 flex justify-end">
              <CancelVisitButton visitId={visit.id} label="Cancelar visita" />
            </div>
          )}

          {visit.agentName && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-sm">
              <span className="text-muted-foreground">Asesor: {visit.agentName}</span>
              {(visit.agentWhatsapp || visit.agentPhone) && (
                <a
                  href={buildWhatsappUrl({
                    phone: visit.agentWhatsapp || visit.agentPhone!,
                    message: `Hola ${visit.agentName}, te escribo sobre mi visita ${visit.visitCode} en Paradise Homes RD.`,
                  })}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-verified hover:bg-secondary"
                >
                  <MessageCircleIcon className="size-3.5" />
                  WhatsApp
                </a>
              )}
              {visit.agentPhone && (
                <a
                  href={`tel:+1${visit.agentPhone}`}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <PhoneIcon className="size-3.5" />
                  {visit.agentPhone}
                </a>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
