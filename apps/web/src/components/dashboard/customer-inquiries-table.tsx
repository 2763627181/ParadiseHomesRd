import Link from "next/link";
import { MessageCircleIcon, PhoneIcon } from "lucide-react";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";
import { formatRelativeRd } from "@paradise/utils/datetime";
import { ROUTES, type LeadStatus } from "@paradise/config";

import { STATUS_LABELS_ES } from "@/lib/lead-status";
import type { CustomerInquiry } from "@/lib/data/customer";
import { Badge } from "@/components/ui/badge";

// Duplicado (no importado) de `STATUS_VARIANT` de `leads-table.tsx` a propósito:
// ese archivo es "use client" y este es un Server Component — mejor no cruzar
// ese límite para un simple mapa de datos.
const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  NEW: "default",
  CONTACTED: "secondary",
  QUALIFIED: "warning",
  VISIT_SCHEDULED: "warning",
  VISIT_COMPLETED: "warning",
  NEGOTIATING: "warning",
  RESERVED: "success",
  CLOSED_WON: "success",
  CLOSED_LOST: "destructive",
};

/** Lista de solo lectura de las consultas (leads) enviadas por el propio usuario. */
export function CustomerInquiriesTable({ inquiries }: { inquiries: CustomerInquiry[] }) {
  if (inquiries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        Aún no has enviado ninguna consulta.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {inquiries.map((inquiry) => {
        const target = inquiry.propertyTitle
          ? { label: inquiry.propertyTitle, href: inquiry.propertySlug ? ROUTES.property(inquiry.propertySlug) : undefined }
          : inquiry.projectName
            ? { label: inquiry.projectName, href: inquiry.projectSlug ? ROUTES.project(inquiry.projectSlug) : undefined }
            : { label: "Consulta general", href: undefined };

        return (
          <div key={inquiry.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                {target.href ? (
                  <Link href={target.href} className="font-medium hover:underline">
                    {target.label}
                  </Link>
                ) : (
                  <p className="font-medium">{target.label}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {inquiry.leadCode} · {formatRelativeRd(inquiry.createdAt)}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[inquiry.status]}>{STATUS_LABELS_ES[inquiry.status]}</Badge>
            </div>

            {inquiry.message && (
              <p className="mt-3 line-clamp-2 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                {inquiry.message}
              </p>
            )}

            {inquiry.agentName && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/70 pt-3 text-sm">
                <span className="text-muted-foreground">Asesor: {inquiry.agentName}</span>
                {(inquiry.agentWhatsapp || inquiry.agentPhone) && (
                  <a
                    href={buildWhatsappUrl({
                      phone: inquiry.agentWhatsapp || inquiry.agentPhone!,
                      message: `Hola ${inquiry.agentName}, te escribo por mi consulta ${inquiry.leadCode} en Paradise Homes RD.`,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-verified hover:bg-secondary"
                  >
                    <MessageCircleIcon className="size-3.5" />
                    WhatsApp
                  </a>
                )}
                {inquiry.agentPhone && (
                  <a
                    href={`tel:+1${inquiry.agentPhone}`}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <PhoneIcon className="size-3.5" />
                    {inquiry.agentPhone}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
