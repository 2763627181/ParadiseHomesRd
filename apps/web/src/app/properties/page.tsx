import type { Metadata } from "next";
import Link from "next/link";
import { SearchXIcon } from "lucide-react";
import { PROPERTY_TYPE_LABELS_PLURAL, OPERATION_LABELS } from "@paradise/config";

import { parseSearchParams } from "@/lib/search-params";
import { searchProperties } from "@/lib/data/properties";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/common/empty-state";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertyResults } from "@/components/property/property-results";
import { ResultsToolbar } from "@/components/property/results-toolbar";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = parseSearchParams(await searchParams);
  const op = params.operationType ? OPERATION_LABELS[params.operationType].toLowerCase() : "propiedades";
  const type = params.propertyTypes[0]
    ? PROPERTY_TYPE_LABELS_PLURAL[params.propertyTypes[0] as keyof typeof PROPERTY_TYPE_LABELS_PLURAL]
    : "Propiedades";

  return {
    title: `${type} para ${op} en República Dominicana`,
    description: `Explora ${type.toLowerCase()} verificadas para ${op} en República Dominicana. Filtra por zona, precio, habitaciones y más en Paradise Homes RD.`,
    alternates: { canonical: "/properties" },
  };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = parseSearchParams(await searchParams);
  const result = await searchProperties(params);

  const heading =
    params.propertyTypes.length === 1
      ? PROPERTY_TYPE_LABELS_PLURAL[
          params.propertyTypes[0] as keyof typeof PROPERTY_TYPE_LABELS_PLURAL
        ]
      : params.operationType
        ? `Propiedades en ${OPERATION_LABELS[params.operationType].toLowerCase()}`
        : "Todas las propiedades";

  return (
    <Container className="py-8 lg:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          En Santo Domingo, Punta Cana, Santiago, Las Terrenas y toda República Dominicana.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[19rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] rounded-xl border border-border/70 bg-card p-4">
            <PropertyFilters className="max-h-[calc(100dvh-9rem)]" />
          </div>
        </aside>

        <div>
          <ResultsToolbar total={result.total} />
          <div className="mt-6">
            {result.items.length === 0 ? (
              <EmptyState
                icon={SearchXIcon}
                title="No encontramos propiedades con estos filtros"
                description="Prueba ampliar el rango de precio o quitar algún filtro."
                action={
                  <Button asChild variant="outline">
                    <Link href="/properties">Limpiar filtros</Link>
                  </Button>
                }
              />
            ) : (
              <PropertyResults
                initialPage={{
                  items: result.items,
                  total: result.total,
                  nextCursor: result.nextCursor,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
