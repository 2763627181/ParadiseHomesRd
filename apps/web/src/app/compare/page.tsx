"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ScaleIcon, XIcon } from "lucide-react";
import { AMENITIES_BY_KEY, CONDITION_LABELS, ROUTES } from "@paradise/config";
import { formatArea, formatLocationLabel } from "@paradise/utils/format";
import { formatDateRd } from "@paradise/utils/datetime";
import { formatPricePerM2 } from "@paradise/utils/currency";
import type { PropertyComparisonRow } from "@paradise/types";

import { useCompareStore, MAX_COMPARE } from "@/stores/compare";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/common/empty-state";
import { PriceDisplay } from "@/components/common/price-display";

interface CompareRow {
  label: string;
  render: (row: PropertyComparisonRow) => React.ReactNode;
}

const ROWS: CompareRow[] = [
  { label: "Precio", render: (r) => <PriceDisplay price={r.property.price} className="text-base" /> },
  {
    label: "Precio/m²",
    render: (r) => {
      const formatted =
        !r.property.price.onRequest && r.property.constructionM2
          ? formatPricePerM2(r.property.price.amount, r.property.constructionM2, r.property.price.currency)
          : null;
      return formatted ?? <span className="text-muted-foreground">—</span>;
    },
  },
  { label: "Habitaciones", render: (r) => r.property.bedrooms ?? "—" },
  { label: "Baños", render: (r) => r.property.bathrooms ?? "—" },
  {
    label: "Construcción",
    render: (r) => (r.property.constructionM2 ? formatArea(r.property.constructionM2) : "—"),
  },
  { label: "Terreno", render: (r) => (r.property.landM2 ? formatArea(r.property.landM2) : "—") },
  {
    label: "Mantenimiento",
    render: (r) =>
      r.maintenanceFee ? (
        <PriceDisplay price={r.maintenanceFee} className="text-sm" />
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    label: "Entrega",
    render: (r) => (r.deliveryDate ? formatDateRd(r.deliveryDate) : <span className="text-muted-foreground">—</span>),
  },
  {
    label: "Ubicación",
    render: (r) =>
      formatLocationLabel({
        sector: r.property.location.sector,
        city: r.property.location.city,
        province: r.property.location.province,
      }),
  },
  {
    label: "Airbnb permitido",
    render: (r) => (r.airbnbFriendly ? "Sí" : "No"),
  },
  {
    label: "Estado",
    render: (r) => (r.conditionStatus ? CONDITION_LABELS[r.conditionStatus] : "—"),
  },
  {
    label: "Amenidades",
    render: (r) =>
      r.amenityKeys.length ? (
        <div className="flex flex-wrap gap-1">
          {r.amenityKeys.slice(0, 8).map((key) => (
            <Badge key={key} variant="secondary" className="text-[0.65rem]">
              {AMENITIES_BY_KEY[key]?.label ?? key}
            </Badge>
          ))}
          {r.amenityKeys.length > 8 && (
            <span className="text-xs text-muted-foreground">+{r.amenityKeys.length - 8}</span>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
];

export default function ComparePage() {
  const hydrated = useCompareStore((s) => s.hydrated);
  const ids = useCompareStore((s) => s.ids);
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);

  const key = [...ids].sort().join(",");
  const query = useQuery({
    queryKey: ["compare", key],
    enabled: hydrated && ids.length > 0,
    queryFn: async (): Promise<{ items: PropertyComparisonRow[] }> => {
      const res = await fetch(`/api/compare?ids=${ids.join(",")}`);
      return res.json();
    },
  });

  const items = query.data?.items ?? [];
  const empty = hydrated && ids.length === 0;

  return (
    <Container className="py-8 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Comparador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Compara hasta {MAX_COMPARE} propiedades lado a lado.
          </p>
        </div>
        {ids.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => clear()}>
            Vaciar comparador
          </Button>
        )}
      </header>

      {!hydrated && <div className="h-64 animate-pulse rounded-xl bg-muted" />}

      {empty && (
        <EmptyState
          icon={ScaleIcon}
          title="Aún no tienes propiedades en el comparador"
          description="Toca el ícono de balanza en cualquier propiedad para añadirla aquí."
          action={
            <Button asChild>
              <Link href="/properties">Explorar propiedades</Link>
            </Button>
          }
        />
      )}

      {hydrated && ids.length > 0 && query.isLoading && (
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="w-40 shrink-0 p-3 text-left align-bottom text-xs font-medium text-muted-foreground">
                  Propiedad
                </th>
                {items.map((row) => (
                  <th key={row.property.id} className="min-w-[200px] p-3 text-left align-top">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => remove(row.property.id)}
                        aria-label="Quitar del comparador"
                        className="absolute right-0 top-0 inline-flex size-6 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-sm hover:text-foreground"
                      >
                        <XIcon className="size-3.5" />
                      </button>
                      <Link href={ROUTES.property(row.property.slug)} className="block">
                        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
                          {row.property.coverImage?.url && (
                            <Image
                              src={row.property.coverImage.url}
                              alt={row.property.title}
                              fill
                              sizes="220px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground">
                          {row.property.title}
                        </p>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.label}
                  className={cn("border-b border-border last:border-0", i % 2 === 1 && "bg-secondary/20")}
                >
                  <td className="p-3 align-top text-xs font-medium text-muted-foreground">{r.label}</td>
                  {items.map((row) => (
                    <td key={row.property.id} className="p-3 align-top">
                      {r.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
