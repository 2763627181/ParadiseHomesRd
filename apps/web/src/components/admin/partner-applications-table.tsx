"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, Loader2Icon, MailIcon, MessageCircleIcon, PhoneIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { PARTNER_TYPE_LABELS } from "@paradise/validation";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";
import { approvePartnerApplication, rejectPartnerApplication } from "@/lib/actions/provisioning";
import type { PartnerApplicationRow } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const STATUS_META: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" }> = {
  new: { label: "Nueva", variant: "default" },
  contacted: { label: "Contactada", variant: "warning" },
  approved: { label: "Aprobada", variant: "success" },
  rejected: { label: "Rechazada", variant: "destructive" },
};

export const PARTNER_STATUS_TABS = [
  ["new", "Nuevas"],
  ["contacted", "Contactadas"],
  ["approved", "Aprobadas"],
  ["rejected", "Rechazadas"],
  ["ALL", "Todas"],
] as const;

export function PartnerStatusTabs({ active, counts }: { active: string; counts: Record<string, number> }) {
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {PARTNER_STATUS_TABS.map(([value, label]) => (
        <Link
          key={value}
          href={value === "ALL" ? "/admin/partners" : `/admin/partners?status=${value}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
          <span className={cn("text-xs", active === value ? "opacity-80" : "opacity-60")}>
            {counts[value] ?? 0}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function PartnerApplicationsTable({ rows }: { rows: PartnerApplicationRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [rejectFor, setRejectFor] = React.useState<PartnerApplicationRow | null>(null);
  const [reason, setReason] = React.useState("");

  const run = async (id: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setPendingId(id);
    const res = await fn();
    setPendingId(null);
    if (res.ok) {
      toast.success(res.message ?? "Actualizado");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo actualizar");
    }
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No hay solicitudes con este filtro.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Empresa</th>
              <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Contacto</th>
              <th className="hidden px-4 py-2.5 text-left font-medium lg:table-cell">Zonas</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((row) => {
              const busy = pendingId === row.id;
              const meta = STATUS_META[row.status] ?? STATUS_META.new!;
              const isOwner = row.partnerType === "owner";
              const canAct = row.status === "new" || row.status === "contacted";
              return (
                <tr key={row.id} className="align-top hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <p className="line-clamp-1 font-medium">{row.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {PARTNER_TYPE_LABELS[row.partnerType as keyof typeof PARTNER_TYPE_LABELS] ?? row.partnerType}
                      {row.inventorySize && ` · ${row.inventorySize} propiedades`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelativeRd(row.createdAt)}</p>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="text-xs font-medium text-foreground">{row.contactName}</p>
                    <div className="mt-1 flex items-center gap-1 text-muted-foreground">
                      <a
                        href={`mailto:${row.email}`}
                        className="rounded-md p-1 hover:bg-secondary hover:text-foreground"
                        title={row.email}
                      >
                        <MailIcon className="size-3.5" />
                      </a>
                      <a
                        href={`tel:+1${row.phone}`}
                        className="rounded-md p-1 hover:bg-secondary hover:text-foreground"
                        title="Llamar"
                      >
                        <PhoneIcon className="size-3.5" />
                      </a>
                      {(row.whatsapp || row.phone) && (
                        <a
                          href={buildWhatsappUrl({
                            phone: row.whatsapp || row.phone,
                            message: `Hola ${row.contactName}, te contactamos desde Paradise Homes RD sobre tu solicitud como socio.`,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md p-1 hover:bg-secondary hover:text-verified"
                          title="WhatsApp"
                        >
                          <MessageCircleIcon className="size-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="hidden max-w-[12rem] px-4 py-3 text-xs text-muted-foreground lg:table-cell">
                    <span className="line-clamp-2">{row.locations.join(", ") || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canAct && (
                        <Button
                          size="sm"
                          onClick={() => run(row.id, () => approvePartnerApplication(row.id))}
                          disabled={busy}
                        >
                          {busy ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                          {isOwner ? "Marcar como contactado" : "Aprobar y crear cuenta"}
                        </Button>
                      )}
                      {canAct && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRejectFor(row);
                            setReason("");
                          }}
                          disabled={busy}
                        >
                          <XIcon className="size-4" />
                          Rechazar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud de «{rejectFor?.companyName}»</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Motivo (opcional, queda registrado internamente)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={pendingId === rejectFor?.id}
              onClick={async () => {
                if (!rejectFor) return;
                await run(rejectFor.id, () => rejectPartnerApplication(rejectFor.id, reason || undefined));
                setRejectFor(null);
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
