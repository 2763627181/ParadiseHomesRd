"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheckIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { PROPERTY_TYPE_LABELS } from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";
import { verifyAgency, verifyAgent, verifyProperty } from "@/lib/actions/verification";
import type {
  AdminVerificationAgencyRow,
  AdminVerificationAgentRow,
  AdminVerificationPropertyRow,
} from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function EmptyState({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
      {label}
    </p>
  );
}

function VerifyButton({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick} disabled={busy}>
      {busy ? <Loader2Icon className="size-4 animate-spin" /> : <BadgeCheckIcon className="size-4" />}
      Verificar
    </Button>
  );
}

function useVerifyRunner() {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<{ ok: boolean; message?: string }>) => {
    setPendingId(id);
    const res = await fn();
    setPendingId(null);
    if (res.ok) {
      toast.success("Verificado como Paradise Verified");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo verificar");
    }
  };

  return { pendingId, run };
}

export function PropertyVerificationTable({ rows }: { rows: AdminVerificationPropertyRow[] }) {
  const { pendingId, run } = useVerifyRunner();

  if (rows.length === 0) {
    return <EmptyState label="No hay propiedades pendientes de verificación." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Propiedad</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Publicada por</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => {
            const busy = pendingId === row.id;
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
                        {row.code} ·{" "}
                        {PROPERTY_TYPE_LABELS[row.propertyType as keyof typeof PROPERTY_TYPE_LABELS] ??
                          row.propertyType}
                        {" · "}
                        {row.priceOnRequest || row.price == null
                          ? "A consultar"
                          : formatPrice(row.price, row.currency as "USD" | "DOP", { compact: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[row.sectorName, row.cityName].filter(Boolean).join(", ") || "Sin ubicación"}
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
                  {row.agencyName ?? row.agentName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button asChild variant="ghost" size="icon-sm" title="Ver detalle">
                      <Link href={`/property/${row.slug}`} target="_blank">
                        <ExternalLinkIcon className="size-4" />
                      </Link>
                    </Button>
                    <VerifyButton busy={busy} onClick={() => run(row.id, () => verifyProperty(row.id))} />
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

export function AgentVerificationTable({ rows }: { rows: AdminVerificationAgentRow[] }) {
  const { pendingId, run } = useVerifyRunner();

  if (rows.length === 0) {
    return <EmptyState label="No hay agentes pendientes de verificación." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Agente</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Contacto</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => {
            const busy = pendingId === row.id;
            return (
              <tr key={row.id} className="align-top hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
                      {row.avatarUrl && (
                        <Image src={row.avatarUrl} alt="" fill sizes="44px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{row.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.agencyName ?? "Independiente"}
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
                  {row.phone ?? "—"}
                  <br />
                  {row.email ?? ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button asChild variant="ghost" size="icon-sm" title="Ver perfil">
                      <Link href={`/agent/${row.slug}`} target="_blank">
                        <ExternalLinkIcon className="size-4" />
                      </Link>
                    </Button>
                    <VerifyButton busy={busy} onClick={() => run(row.id, () => verifyAgent(row.id))} />
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

export function AgencyVerificationTable({ rows }: { rows: AdminVerificationAgencyRow[] }) {
  const { pendingId, run } = useVerifyRunner();

  if (rows.length === 0) {
    return <EmptyState label="No hay inmobiliarias pendientes de verificación." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Inmobiliaria</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Contacto</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => {
            const busy = pendingId === row.id;
            return (
              <tr key={row.id} className="align-top hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                      {row.logoUrl && (
                        <Image src={row.logoUrl} alt="" fill sizes="44px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.cityName ?? "Sin ubicación"}
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
                  {row.phone ?? "—"}
                  <br />
                  {row.email ?? ""}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button asChild variant="ghost" size="icon-sm" title="Ver perfil">
                      <Link href={`/agency/${row.slug}`} target="_blank">
                        <ExternalLinkIcon className="size-4" />
                      </Link>
                    </Button>
                    <VerifyButton busy={busy} onClick={() => run(row.id, () => verifyAgency(row.id))} />
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

export function EntityTabs({
  active,
  counts,
}: {
  active: "properties" | "agents" | "agencies";
  counts: Record<"properties" | "agents" | "agencies", number>;
}) {
  const tabs = [
    ["properties", "Propiedades"],
    ["agents", "Agentes"],
    ["agencies", "Inmobiliarias"],
  ] as const;
  return (
    <div className="mb-5 flex flex-wrap gap-1.5">
      {tabs.map(([value, label]) => (
        <Link
          key={value}
          href={value === "properties" ? "/admin/verifications" : `/admin/verifications?tab=${value}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            active === value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
          <span className={cn("text-xs", active === value ? "opacity-80" : "opacity-60")}>
            {counts[value]}
          </span>
        </Link>
      ))}
    </div>
  );
}
