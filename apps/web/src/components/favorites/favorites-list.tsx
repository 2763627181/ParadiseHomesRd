"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import type { ProjectSummary, PropertySummary } from "@paradise/types";

import { useFavoritesStore } from "@/stores/favorites";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { PropertyCard } from "@/components/property/property-card";
import { ProjectCard } from "@/components/project/project-card";
import { PropertyGridSkeleton } from "@/components/property/property-card-skeleton";

/** Grilla de favoritos (propiedades + proyectos). Sin cabecera ni contenedor: se
 *  usa tanto en la página pública `/favorites` como en `/dashboard/favorites`. */
export function FavoritesList() {
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const items = useFavoritesStore((s) => s.items);

  const propertyIds = Object.values(items)
    .filter((i) => i.kind === "property")
    .map((i) => i.id);
  const projectIds = Object.values(items)
    .filter((i) => i.kind === "project")
    .map((i) => i.id);

  const query = useQuery({
    queryKey: ["favorites", propertyIds.sort().join(","), projectIds.sort().join(",")],
    enabled: hydrated && (propertyIds.length > 0 || projectIds.length > 0),
    queryFn: async (): Promise<{ properties: PropertySummary[]; projects: ProjectSummary[] }> => {
      const sp = new URLSearchParams();
      if (propertyIds.length) sp.set("properties", propertyIds.join(","));
      if (projectIds.length) sp.set("projects", projectIds.join(","));
      const res = await fetch(`/api/collections?${sp.toString()}`);
      return res.json();
    },
  });

  const empty = hydrated && propertyIds.length === 0 && projectIds.length === 0;

  if (!hydrated) return <PropertyGridSkeleton count={3} />;

  if (empty) {
    return (
      <EmptyState
        icon={HeartIcon}
        title="Aún no tienes favoritos"
        description="Toca el corazón en cualquier propiedad para guardarla aquí."
        action={
          <Button asChild>
            <Link href="/properties">Explorar propiedades</Link>
          </Button>
        }
      />
    );
  }

  if (query.isLoading) return <PropertyGridSkeleton count={3} />;

  if (!query.data) return null;

  return (
    <div className="space-y-10">
      {query.data.properties.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Propiedades ({query.data.properties.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
      {query.data.projects.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-medium text-muted-foreground">
            Proyectos ({query.data.projects.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {query.data.projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
