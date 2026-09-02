import type { Metadata } from "next";
import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { MapSearchView } from "@/components/map/map-search-view";

export const metadata: Metadata = {
  title: "Mapa de propiedades en República Dominicana",
  description: "Explora propiedades verificadas sobre el mapa. Mueve el mapa y busca en cualquier zona.",
  alternates: { canonical: "/map" },
};

export default function MapPage() {
  return (
    <Container size="wide" className="py-6">
      <h1 className="mb-4 text-xl font-semibold tracking-tight">Explora sobre el mapa</h1>
      <Suspense fallback={<div className="h-[calc(100dvh-8rem)] animate-pulse rounded-xl bg-muted" />}>
        <MapSearchView layout="full" />
      </Suspense>
    </Container>
  );
}
