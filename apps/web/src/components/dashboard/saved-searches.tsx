"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2Icon, SearchIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { ALERT_FREQUENCY, type AlertFrequency } from "@paradise/config";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { serializeSearchParams, summarizeSearchParams } from "@/lib/search-params";
import { deleteSavedSearch, updateSavedSearchAlertFrequency } from "@/lib/actions/customer";
import type { CustomerSavedSearch } from "@/lib/data/customer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const ALERT_FREQUENCY_LABELS_ES: Record<AlertFrequency, string> = {
  off: "Desactivado",
  instant: "Instantáneo",
  daily: "Diario",
  weekly: "Semanal",
};

const ALERT_FREQUENCY_VARIANT: Record<AlertFrequency, "outline" | "success" | "accent" | "secondary"> = {
  off: "outline",
  instant: "success",
  daily: "accent",
  weekly: "secondary",
};

/** Lista de búsquedas guardadas: resultados + eliminar. Usada en /dashboard/searches. */
export function SavedSearchesList({ searches }: { searches: CustomerSavedSearch[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const remove = async (id: string) => {
    setPendingId(id);
    const res = await deleteSavedSearch(id);
    setPendingId(null);
    if (res.ok) {
      toast.success("Búsqueda eliminada");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo eliminar");
    }
  };

  return (
    <div className="space-y-3">
      {searches.map((search) => {
        const label = search.name?.trim() || summarizeSearchParams(search.params);
        const href = `/properties${serializeSearchParams(search.params)}`;
        const busy = pendingId === search.id;
        return (
          <div
            key={search.id}
            className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Guardada {formatRelativeRd(search.createdAt)}
                {search.lastRunAt && ` · último aviso ${formatRelativeRd(search.lastRunAt)}`}
              </p>
              <Badge variant={ALERT_FREQUENCY_VARIANT[search.alertFrequency]} className="mt-2">
                Alertas: {ALERT_FREQUENCY_LABELS_ES[search.alertFrequency]}
              </Badge>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={href}>
                  <SearchIcon className="size-4" />
                  Ver resultados
                </Link>
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={busy}
                onClick={() => remove(search.id)}
                aria-label="Eliminar búsqueda"
                className="text-muted-foreground hover:text-destructive"
              >
                {busy ? <Loader2Icon className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Gestión de frecuencia de alerta por búsqueda guardada. Usada en /dashboard/alerts. */
export function AlertFrequencyManager({ searches }: { searches: CustomerSavedSearch[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const setFrequency = async (id: string, frequency: AlertFrequency) => {
    setPendingId(id);
    const res = await updateSavedSearchAlertFrequency(id, frequency);
    setPendingId(null);
    if (res.ok) {
      toast.success("Frecuencia actualizada");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo actualizar");
    }
  };

  return (
    <div className="space-y-3">
      {searches.map((search) => {
        const label = search.name?.trim() || summarizeSearchParams(search.params);
        const busy = pendingId === search.id;
        return (
          <div
            key={search.id}
            className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Guardada {formatRelativeRd(search.createdAt)}
              </p>
            </div>
            <Select
              value={search.alertFrequency}
              disabled={busy}
              onValueChange={(v) => setFrequency(search.id, v as AlertFrequency)}
            >
              <SelectTrigger size="sm" className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {Object.values(ALERT_FREQUENCY).map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {ALERT_FREQUENCY_LABELS_ES[freq]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
