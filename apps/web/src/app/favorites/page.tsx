"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import type { ProjectSummary, PropertySummary } from "@paradise/types";

import { useFavoritesStore } from "@/stores/favorites";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/common/empty-state";
import { PropertyCard } from "@/components/property/property-card";
import { ProjectCard } from "@/components/project/project-card";
import { PropertyGridSkeleton } from "@/components/property/property-card-skeleton";

export default function FavoritesPage() {
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

  return (
    <Container className="py-8 lg:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Favoritos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se guardan en este dispositivo. Inicia sesión para sincronizarlos.
        </p>
      </header>

      {!hydrated && <PropertyGridSkeleton count={3} />}

      {empty && (
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
      )}

      {query.isLoading && <PropertyGridSkeleton count={3} />}

      {query.data && (
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
      )}
    </Container>
  );
}
