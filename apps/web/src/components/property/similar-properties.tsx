import type { Property } from "@paradise/types";

import { getSimilarProperties } from "@/lib/data/properties";
import { Container } from "@/components/layout/container";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCarousel } from "@/components/property/property-carousel";

export async function SimilarProperties({ property }: { property: Property }) {
  const similar = await getSimilarProperties(property, 8);
  if (similar.length === 0) return null;

  return (
    <section className="border-t border-border/70 py-12">
      <Container>
        <h2 className="mb-6 text-xl font-semibold tracking-tight">Propiedades similares</h2>
        <PropertyCarousel itemClassName="w-[78%] max-w-[20rem] sm:w-80">
          {similar.map((p) => (
            <PropertyCard key={p.id} property={p} variant="compact" />
          ))}
        </PropertyCarousel>
      </Container>
    </section>
  );
}
