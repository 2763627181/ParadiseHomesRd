"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarIcon, CheckIcon, Loader2Icon, MessageCircleIcon, PhoneIcon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";
import { formatVisitDateRd, formatTimeRd, formatDateRd } from "@paradise/utils/datetime";
import type { VisitStatus } from "@paradise/config";

import { completeVisit, markNoShow, scheduleVisit } from "@/lib/actions/visits";
import type { AgentVisitRow } from "@/lib/data/visits";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CancelVisitButton } from "@/components/dashboard/cancel-visit-button";

const STATUS_LABELS: Record<VisitStatus, string> = {
  REQUESTED: "Por confirmar",
  SCHEDULED: "Agendada",
  COMPLETED: "Realizada",
  NO_SHOW: "No asistió",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<VisitStatus, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  REQUESTED: "warning",
  SCHEDULED: "default",
  COMPLETED: "success",
  NO_SHOW: "destructive",
  CANCELLED: "secondary",
};

function isPast(iso: string | null): boolean {
  return iso != null && new Date(iso).getTime() < Date.now();
}

export function VisitsAgenda({
  visits,
  showAgent = false,
  canManage,
}: {
  visits: AgentVisitRow[];
  showAgent?: boolean;
  canManage: boolean;
}) {
  const pending = visits.filter((v) => v.status === "REQUESTED");
  const upcoming = visits
    .filter((v) => v.status === "SCHEDULED" && !isPast(v.scheduledAt))
    .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
  const past = visits
    .filter((v) => !pending.includes(v) && !upcoming.includes(v))
    .sort((a, b) => (b.scheduledAt ?? b.createdAt).localeCompare(a.scheduledAt ?? a.createdAt));

  if (visits.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No hay visitas todavía. Cuando un cliente solicite una desde una propiedad, aparecerá aquí.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <Section title={`Por confirmar (${pending.length})`}>
          {pending.map((v) => (
            <VisitCard key={v.id} visit={v} showAgent={showAgent} canManage={canManage} />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Próximas">
          {groupByDay(upcoming).map(([day, dayVisits]) => (
            <div key={day} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{day}</p>
              {dayVisits.map((v) => (
                <VisitCard key={v.id} visit={v} showAgent={showAgent} canManage={canManage} />
              ))}
            </div>
          ))}
        </Section>
      )}

      {past.length > 0 && (
        <Section title="Pasadas">
          {past.slice(0, 40).map((v) => (
            <VisitCard key={v.id} visit={v} showAgent={showAgent} canManage={canManage} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function groupByDay(visits: AgentVisitRow[]): [string, AgentVisitRow[]][] {
  const map = new Map<string, AgentVisitRow[]>();
  for (const v of visits) {
    const key = v.scheduledAt ? formatDateRd(v.scheduledAt) : "Sin fecha";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(v);
  }
  return [...map.entries()];
}

function VisitCard({
  visit,
  showAgent,
  canManage,
}: {
  visit: AgentVisitRow;
  showAgent: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [date, setDate] = React.useState("");

  const run = async (fn: () => Promise<{ ok: boolean; message?: string }>, okMsg: string) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (res.ok) {
      toast.success(okMsg);
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo completar la acción");
    }
  };

  const whatsappHref =
    visit.contactWhatsapp || visit.contactPhone
      ? buildWhatsappUrl({
          phone: visit.contactWhatsapp || visit.contactPhone!,
          message: `Hola ${visit.contactName}, te escribo sobre la visita a ${visit.propertyTitle ?? "la propiedad"}.`,
        })
      : null;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            {visit.scheduledAt
              ? `${formatVisitDateRd(visit.scheduledAt)} · ${formatTimeRd(visit.scheduledAt)}`
              : "Sin fecha confirmada"}
          </p>
          {visit.propertyTitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {visit.propertySlug ? (
                <Link href={`/property/${visit.propertySlug}`} className="hover:underline">
                  {visit.propertyTitle}
                </Link>
              ) : (
                visit.propertyTitle
              )}
            </p>
          )}
        </div>
        <Badge variant={STATUS_VARIANT[visit.status]}>{STATUS_LABELS[visit.status]}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <UserIcon className="size-3.5" />
          {visit.contactName}
        </span>
        {showAgent && visit.agentName && <span>· Asesor: {visit.agentName}</span>}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-verified hover:underline"
          >
            <MessageCircleIcon className="size-3.5" />
            WhatsApp
          </a>
        )}
        {visit.contactPhone && (
          <a href={`tel:+1${visit.contactPhone}`} className="inline-flex items-center gap-1 hover:text-foreground">
            <PhoneIcon className="size-3.5" />
            {visit.contactPhone}
          </a>
        )}
        <Link href={`/agent/dashboard/leads/${visit.leadId}`} className="hover:text-foreground hover:underline">
          Ver lead {visit.leadCode ?? ""}
        </Link>
      </div>

      {visit.notes && (
        <p className="mt-2 line-clamp-2 rounded-lg bg-secondary p-2.5 text-xs text-muted-foreground">
          {visit.notes}
        </p>
      )}

      {canManage && visit.status === "REQUESTED" && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-border/70 pt-3">
          <div className="flex-1 min-w-[13rem]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirmar fecha y hora</label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
              className="h-9"
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy || !date}
            onClick={() => run(() => scheduleVisit(visit.id, date), "Visita agendada")}
          >
            {busy ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
            Confirmar
          </Button>
          <CancelVisitButton visitId={visit.id} label="Rechazar" />
        </div>
      )}

      {canManage && visit.status === "SCHEDULED" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border/70 pt-3">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => run(() => completeVisit(visit.id), "Marcada como realizada")}
          >
            <CheckIcon className="size-4" />
            Realizada
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => run(() => markNoShow(visit.id), "Marcada como no asistió")}
          >
            No asistió
          </Button>
          <CancelVisitButton visitId={visit.id} label="Cancelar" />
        </div>
      )}
    </div>
  );
}
