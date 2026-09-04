import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon, EyeIcon, HeartIcon } from "lucide-react";
import { PROPERTY_TYPE_LABELS, type PropertyType } from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface PropertyRowItem {
  id: string;
  code: string;
  slug: string;
  title: string;
  status: string;
  propertyType: string;
  price: number | null;
  currency: string;
  priceOnRequest: boolean;
  cityName: string | null;
  sectorName: string | null;
  coverUrl: string | null;
  imageCount: number;
  viewCount: number;
  favoriteCount: number;
  createdAt: string;
  /** Solo se muestra si se pasa `showAgent`. */
  agentName?: string | null;
}

const STATUS_META: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary" | "outline" }> = {
  PENDING_REVIEW: { label: "En revisión", variant: "warning" },
  PUBLISHED: { label: "Publicada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
  DRAFT: { label: "Borrador", variant: "outline" },
  ARCHIVED: { label: "Archivada", variant: "secondary" },
};

export function PropertyRowsTable({
  rows,
  showAgent = false,
}: {
  rows: PropertyRowItem[];
  showAgent?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        Sin resultados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Propiedad</th>
            {showAgent && (
              <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Asesor</th>
            )}
            <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Rendimiento</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => {
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
                        {row.code} · {PROPERTY_TYPE_LABELS[row.propertyType as PropertyType] ?? row.propertyType}
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
                    </div>
                  </div>
                </td>
                {showAgent && (
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                    {row.agentName ?? "—"}
                  </td>
                )}
                <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                  <span className="inline-flex items-center gap-1">
                    <EyeIcon className="size-3.5" />
                    {row.viewCount.toLocaleString("es-DO")}
                  </span>
                  <span className="ml-3 inline-flex items-center gap-1">
                    <HeartIcon className="size-3.5" />
                    {row.favoriteCount.toLocaleString("es-DO")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <Button asChild variant="ghost" size="icon-sm" title="Ver publicación">
                      <Link href={`/property/${row.slug}`} target="_blank">
                        <ExternalLinkIcon className="size-4" />
                      </Link>
                    </Button>
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
