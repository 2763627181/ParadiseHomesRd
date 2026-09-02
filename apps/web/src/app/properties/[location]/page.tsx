import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon, SearchXIcon } from "lucide-react";
import { getLocationPath } from "@paradise/config";

import { parseSearchParams } from "@/lib/search-params";
import { searchProperties } from "@/lib/data/properties";
import { getLocationBySlug } from "@/lib/data/locations";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/common/empty-state";
import { PropertyFilters } from "@/components/property/property-filters";
import { PropertyResults } from "@/components/property/property-results";
import { ResultsToolbar } from "@/components/property/results-toolbar";

type SearchParams = Record<string, string | string[] | undefined>;

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ location: string }>;
}): Promise<Metadata> {
  const { location } = await params;
  const loc = await getLocationBySlug(location);
  if (!loc) return {};

  return {
    title: `Propiedades en ${loc.name}`,
    description:
      loc.blurb ??
      `Explora propiedades verificadas en venta y alquiler en ${loc.name}, República Dominicana.`,
    alternates: { canonical: `/properties/${location}` },
    openGraph: {
      title: `Propiedades en ${loc.name} · Paradise Homes RD`,
      description: loc.blurb ?? `Propiedades en ${loc.name}, República Dominicana.`,
    },
  };
}

export default async function LocationPropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ location: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { location } = await params;
  const loc = await getLocationBySlug(location);
  if (!loc) notFound();

  const raw = await searchParams;
  const parsed = parseSearchParams({ ...raw, locations: location });
  const result = await searchProperties(parsed);
  const trail = getLocationPath(location);

  return (
    <Container className="py-8 lg:py-10">
      <nav
        aria-label="Migas de pan"
        className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <Link href="/properties" className="hover:text-foreground">
          Propiedades
        </Link>
        {trail.slice(1).map((node, i) => (
          <span key={node.slug} className="flex items-center gap-1">
            <ChevronRightIcon className="size-3.5" />
            {i === trail.length - 2 ? (
              <span className="text-foreground">{node.name}</span>
            ) : (
              <Link href={`/properties/${node.slug}`} className="hover:text-foreground">
                {node.name}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <header className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Propiedades en {loc.name}
        </h1>
        {loc.blurb && <p className="mt-2 text-[0.95rem] text-muted-foreground">{loc.blurb}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[19rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border/70 bg-card p-4">
            <PropertyFilters className="max-h-[calc(100dvh-9rem)]" />
          </div>
        </aside>

        <div>
          <ResultsToolbar total={result.total} />
          <div className="mt-6">
            {result.items.length === 0 ? (
              <EmptyState
                icon={SearchXIcon}
                title={`Aún no hay propiedades en ${loc.name}`}
                description="Estamos sumando inventario en esta zona. Revisa zonas cercanas mientras tanto."
                action={
                  <Button asChild variant="outline">
                    <Link href="/properties">Ver todas las propiedades</Link>
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
