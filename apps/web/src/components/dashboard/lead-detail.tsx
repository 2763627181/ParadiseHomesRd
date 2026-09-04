"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarPlusIcon,
  CheckIcon,
  Loader2Icon,
  MailIcon,
  MessageCircleIcon,
  PhoneIcon,
  SendIcon,
  UserPlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import { LEAD_PIPELINE_ORDER, type LeadStatus } from "@paradise/config";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";
import { formatDateTimeRd, formatRelativeRd } from "@paradise/utils/datetime";
import type { Lead, LeadActivity, LeadNote } from "@paradise/types";

import { cn } from "@/lib/utils";
import { addLeadNote, assignLeadToAgent, updateLeadStatus } from "@/lib/actions/leads-crm";
import { STATUS_LABELS_ES } from "@/lib/lead-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_VARIANT, SOURCE_LABELS } from "@/components/dashboard/leads-table";

const TERMINAL = ["CLOSED_WON", "CLOSED_LOST"] as const;

export function LeadStatusControl({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const set = async (status: LeadStatus) => {
    setPending(true);
    const res = await updateLeadStatus(lead.id, status);
    setPending(false);
    if (res.ok) {
      toast.success(`Estado: ${STATUS_LABELS_ES[status]}`);
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo actualizar");
    }
  };

  const currentIndex = LEAD_PIPELINE_ORDER.indexOf(lead.status);

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pipeline</h3>
        <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABELS_ES[lead.status]}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {LEAD_PIPELINE_ORDER.map((status, i) => (
          <button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => set(status)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
              i <= currentIndex && currentIndex >= 0
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30",
            )}
          >
            {i <= currentIndex && currentIndex >= 0 && <CheckIcon className="mr-1 inline size-3" />}
            {STATUS_LABELS_ES[status]}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-1.5 border-t border-border/70 pt-3">
        {TERMINAL.map((status) => (
          <Button
            key={status}
            size="sm"
            variant={lead.status === status ? "default" : "outline"}
            disabled={pending}
            onClick={() => set(status)}
            className={status === "CLOSED_LOST" ? "text-destructive hover:text-destructive" : ""}
          >
            {STATUS_LABELS_ES[status]}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function LeadContactCard({ lead }: { lead: Lead }) {
  const wa = lead.contact.whatsapp || lead.contact.phone;
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Contacto</h3>
      <p className="font-medium">{lead.contact.fullName}</p>
      <p className="text-xs text-muted-foreground">
        {SOURCE_LABELS[lead.source] ?? lead.source} · {formatRelativeRd(lead.createdAt)}
      </p>
      <div className="mt-3 flex flex-col gap-2">
        {wa && (
          <Button asChild size="sm" variant="outline">
            <a
              href={buildWhatsappUrl({
                phone: wa,
                message: `Hola ${lead.contact.fullName}, te contacto desde Paradise Homes RD${lead.propertyTitle ? ` sobre ${lead.propertyTitle}` : ""}.`,
              })}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircleIcon className="size-4" />
              WhatsApp
            </a>
          </Button>
        )}
        {lead.contact.phone && (
          <Button asChild size="sm" variant="outline">
            <a href={`tel:+1${lead.contact.phone}`}>
              <PhoneIcon className="size-4" />
              {lead.contact.phone}
            </a>
          </Button>
        )}
        {lead.contact.email && (
          <Button asChild size="sm" variant="outline">
            <a href={`mailto:${lead.contact.email}`}>
              <MailIcon className="size-4" />
              {lead.contact.email}
            </a>
          </Button>
        )}
      </div>
      {lead.message && (
        <div className="mt-3 rounded-lg bg-secondary p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Mensaje inicial</p>
          {lead.message}
        </div>
      )}
    </div>
  );
}

export function LeadAssignPanel({
  lead,
  agents,
}: {
  lead: Lead;
  agents: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  if (agents.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
        <UserPlusIcon className="size-4" />
        Asignar
      </h3>
      <Select
        value={lead.agentId ?? ""}
        onValueChange={async (agentId) => {
          setPending(true);
          const res = await assignLeadToAgent(lead.id, agentId);
          setPending(false);
          if (res.ok) {
            toast.success("Lead asignado");
            router.refresh();
          } else {
            toast.error(res.message ?? "No se pudo asignar");
          }
        }}
        disabled={pending}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sin asignar" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function LeadNotesPanel({ leadId, notes }: { leadId: string; notes: LeadNote[] }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setPending(true);
    const res = await addLeadNote(leadId, body);
    setPending(false);
    if (res.ok) {
      setBody("");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo guardar la nota");
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Notas internas</h3>
      <div className="mb-3 space-y-3">
        {notes.length === 0 && (
          <p className="text-sm text-muted-foreground">Sin notas todavía.</p>
        )}
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg bg-secondary p-3 text-sm">
            <p className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{note.authorName}</span>
              {formatRelativeRd(note.createdAt)}
            </p>
            {note.body}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder="Escribe una nota para el equipo…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
        />
        <Button size="icon" onClick={submit} disabled={pending || !body.trim()} className="shrink-0">
          {pending ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

const ACTIVITY_ICON: Record<string, string> = {
  lead_created: "🟢",
  assigned: "👤",
  status_changed: "🔄",
  note_added: "📝",
  whatsapp_sent: "💬",
  contacted: "📞",
  client_replied: "↩️",
  visit_scheduled: "📅",
  visit_completed: "✅",
  email_sent: "✉️",
};

export function LeadTimeline({ activities }: { activities: LeadActivity[] }) {
  if (activities.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Sin actividad registrada.
      </p>
    );
  }
  return (
    <ol className="relative space-y-5 border-l border-border/70 pl-6">
      {activities.map((act) => (
        <li key={act.id} className="relative">
          <span className="absolute -left-[1.95rem] flex size-6 items-center justify-center rounded-full bg-card text-xs">
            {ACTIVITY_ICON[act.type] ?? "•"}
          </span>
          <p className="text-sm font-medium">{act.title}</p>
          {act.body && <p className="mt-0.5 text-sm text-muted-foreground">{act.body}</p>}
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateTimeRd(act.occurredAt)}</p>
        </li>
      ))}
    </ol>
  );
}

export function ScheduleActivityHint({ nextActivityAt }: { nextActivityAt: string | null }) {
  if (!nextActivityAt) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning-foreground">
      <CalendarPlusIcon className="size-4" />
      Próxima actividad: {formatDateTimeRd(nextActivityAt)}
    </div>
  );
}
