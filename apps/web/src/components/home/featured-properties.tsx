import { ROUTES } from "@paradise/config";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/section-heading";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCarousel } from "@/components/property/property-carousel";
import { getFeaturedProperties } from "@/lib/data/properties";

export async function FeaturedProperties() {
  const properties = await getFeaturedProperties(9);
  if (properties.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <SectionHeading
          title="Propiedades que podrían gustarte"
          description="Una selección de publicaciones verificadas en las zonas de mayor demanda."
          action={{ label: "Ver todas", href: ROUTES.properties() }}
        />
        <PropertyCarousel itemClassName="w-[78%] max-w-[20rem] sm:w-[22rem]">
          {properties.map((property, i) => (
            <PropertyCard
              key={property.id}
              property={property}
              variant="compact"
              priority={i < 2}
            />
          ))}
        </PropertyCarousel>
      </Container>
    </section>
  );
}
