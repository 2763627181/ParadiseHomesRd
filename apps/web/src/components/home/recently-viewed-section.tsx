import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import { getRecentlyViewedProperties } from "@/lib/data/collections";
import { Container } from "@/components/layout/container";
import { PropertyCard } from "@/components/property/property-card";

/** "Sigue donde lo dejaste" — solo para usuarios con sesión y con historial. */
export async function RecentlyViewedSection() {
  const user = await getSessionUser();
  if (!user) return null;

  const properties = await getRecentlyViewedProperties(user.id, 4);
  if (properties.length < 2) return null;

  return (
    <section className="py-10 lg:py-12">
      <Container>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Sigue donde lo dejaste</h2>
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:underline">
            Mi actividad
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </Container>
    </section>
  );
}
