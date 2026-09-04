"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import { LEAD_PIPELINE_ORDER, type LeadStatus } from "@paradise/config";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";
import { formatRelativeRd } from "@paradise/utils/datetime";
import type { Lead } from "@paradise/types";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS_ES } from "@/lib/actions/leads-crm";

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

const SOURCE_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google",
  youtube: "YouTube",
  organic: "Orgánico",
  referral: "Referido",
  direct: "Directo",
};

export function LeadsStatusFilter({ basePath, active }: { basePath: string; active: string }) {
  const tabs: { value: string; label: string }[] = [
    { value: "ALL", label: "Todos" },
    ...LEAD_PIPELINE_ORDER.map((s) => ({ value: s, label: STATUS_LABELS_ES[s] })),
    { value: "CLOSED_WON", label: "Ganados" },
    { value: "CLOSED_LOST", label: "Perdidos" },
  ];
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "ALL" ? basePath : `${basePath}?status=${tab.value}`}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === tab.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

export function LeadsTable({ leads, detailBase }: { leads: Lead[]; detailBase: string }) {
  const router = useRouter();

  if (leads.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No hay leads con este filtro todavía.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Contacto</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Propiedad</th>
            <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Origen</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {leads.map((lead) => {
            const wa = lead.contact.whatsapp || lead.contact.phone;
            return (
              <tr
                key={lead.id}
                className="cursor-pointer align-top hover:bg-secondary/30"
                onClick={() => router.push(`${detailBase}/${lead.id}`)}
              >
                <td className="px-4 py-3">
                  <p className="font-medium">{lead.contact.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.leadCode} · {formatRelativeRd(lead.createdAt)}
                  </p>
                  {lead.agentName && (
                    <p className="text-xs text-muted-foreground">Asesor: {lead.agentName}</p>
                  )}
                </td>
                <td className="hidden max-w-[14rem] px-4 py-3 text-xs text-muted-foreground md:table-cell">
                  <span className="line-clamp-2">{lead.propertyTitle ?? "—"}</span>
                </td>
                <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  {SOURCE_LABELS[lead.source] ?? lead.source}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABELS_ES[lead.status]}</Badge>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {wa && (
                      <a
                        href={buildWhatsappUrl({ phone: wa, message: `Hola ${lead.contact.fullName}, te contacto desde Paradise Homes RD.` })}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-verified"
                        title="WhatsApp"
                      >
                        <MessageCircleIcon className="size-4" />
                      </a>
                    )}
                    {lead.contact.phone && (
                      <a
                        href={`tel:+1${lead.contact.phone}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        title="Llamar"
                      >
                        <PhoneIcon className="size-4" />
                      </a>
                    )}
                    <Link
                      href={`${detailBase}/${lead.id}`}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                      title="Ver"
                    >
                      <ChevronRightIcon className="size-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { STATUS_VARIANT, SOURCE_LABELS };
