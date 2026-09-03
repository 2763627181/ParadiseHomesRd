"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, ExternalLinkIcon, Loader2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { CONDITION_LABELS, PROPERTY_TYPE_LABELS } from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";
import {
  approveProperty,
  rejectProperty,
  unpublishProperty,
} from "@/lib/actions/moderation";
import type { AdminPropertyRow } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_META: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary" | "outline" }> = {
  PENDING_REVIEW: { label: "En revisión", variant: "warning" },
  PUBLISHED: { label: "Publicada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
  DRAFT: { label: "Borrador", variant: "outline" },
  ARCHIVED: { label: "Archivada", variant: "secondary" },
};

export function PropertyModerationTable({ rows }: { rows: AdminPropertyRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [rejectFor, setRejectFor] = React.useState<AdminPropertyRow | null>(null);
  const [reason, setReason] = React.useState("");

  const run = async (id: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setPendingId(id);
    const res = await fn();
    setPendingId(null);
    if (res.ok) {
      toast.success("Actualizado");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo actualizar");
    }
  };

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No hay propiedades con este estado.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Propiedad</th>
              <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Contacto</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.map((row) => {
              const busy = pendingId === row.id;
              const meta = STATUS_META[row.status] ?? STATUS_META.DRAFT!;
              return (
                <tr key={row.id} className="align-top hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
                        {row.coverUrl && (
                          <Image src={row.coverUrl} alt="" fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{row.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.code} · {PROPERTY_TYPE_LABELS[row.propertyType as keyof typeof PROPERTY_TYPE_LABELS] ?? row.propertyType}
                          {" · "}
                          {row.priceOnRequest || row.price == null
                            ? "A consultar"
                            : formatPrice(row.price, row.currency as "USD" | "DOP", { compact: true })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[row.sectorName, row.cityName].filter(Boolean).join(", ") || "Sin ubicación"}
                          {" · "}
                          {row.imageCount} foto{row.imageCount === 1 ? "" : "s"}
                          {" · "}
                          {formatRelativeRd(row.createdAt)}
                        </p>
                        {row.isDemo && (
                          <Badge variant="outline" className="mt-1 text-[0.65rem]">
                            demo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {row.agencyName ?? row.agentName ?? row.contactName ?? "—"}
                    <br />
                    {row.contactPhone}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    {row.status === "REJECTED" && row.rejectReason && (
                      <p className="mt-1 max-w-[10rem] text-[0.7rem] text-muted-foreground">
                        {row.rejectReason}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button asChild variant="ghost" size="icon-sm" title="Ver">
                        <Link href={`/property/${row.slug}`} target="_blank">
                          <ExternalLinkIcon className="size-4" />
                        </Link>
                      </Button>
                      {row.status !== "PUBLISHED" && (
                        <Button
                          size="sm"
                          onClick={() => run(row.id, () => approveProperty(row.id))}
                          disabled={busy}
                        >
                          {busy ? <Loader2Icon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
                          Aprobar
                        </Button>
                      )}
                      {row.status === "PENDING_REVIEW" && (
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
                      {row.status === "PUBLISHED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => run(row.id, () => unpublishProperty(row.id))}
                          disabled={busy}
                        >
                          Despublicar
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
            <DialogTitle>Rechazar «{rejectFor?.title}»</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={3}
            placeholder="Motivo (se guarda en el historial y ayuda a quien publicó a corregir)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectFor(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!reason.trim() || pendingId === rejectFor?.id}
              onClick={async () => {
                if (!rejectFor) return;
                await run(rejectFor.id, () => rejectProperty(rejectFor.id, reason));
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

export function StatusTabs({
  counts,
  active,
}: {
  counts: Record<string, number>;
  active: string;
}) {
  const tabs = [
    ["PENDING_REVIEW", "En revisión"],
    ["PUBLISHED", "Publicadas"],
    ["REJECTED", "Rechazadas"],
    ["DRAFT", "Borradores"],
    ["ARCHIVED", "Archivadas"],
    ["ALL", "Todas"],
  ] as const;
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {tabs.map(([value, label]) => (
        <Link
          key={value}
          href={value === "ALL" ? "/admin/properties" : `/admin/properties?status=${value}`}
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
