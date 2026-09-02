import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@paradise/config";

import { Container } from "@/components/layout/container";
import { locationImage } from "@/config/location-images";
import { getFeaturedLocations } from "@/lib/data/locations";

const HIGHLIGHT_SLUGS = [
  "santo-domingo-dn",
  "punta-cana",
  "santiago-de-los-caballeros",
  "las-terrenas",
  "cap-cana",
  "juan-dolio",
];

export async function QuickSearches() {
  const locations = await getFeaturedLocations();
  const ordered = HIGHLIGHT_SLUGS.map((slug) => locations.find((l) => l.slug === slug)).filter(
    (l): l is NonNullable<typeof l> => Boolean(l),
  );

  return (
    <section className="py-8 sm:py-12">
      <Container>
        <h2 className="mb-5 text-sm font-medium text-muted-foreground">Explora por zona</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ordered.map((loc) => (
            <Link
              key={loc.slug}
              href={ROUTES.propertiesByLocation(loc.slug)}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl sm:aspect-[3/4]"
            >
              <Image
                src={locationImage(loc.slug)}
                alt={loc.name}
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                className="object-cover transition-transform duration-500 ease-[var(--ease-premium)] group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-sm font-semibold text-white">{loc.name}</p>
                {(loc.propertyCount ?? 0) > 0 && (
                  <p className="text-[0.7rem] text-white/80">{loc.propertyCount} propiedades</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
