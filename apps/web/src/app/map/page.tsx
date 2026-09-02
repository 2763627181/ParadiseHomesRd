import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Mapa de propiedades",
  description: "Explora propiedades sobre el mapa de República Dominicana.",
};

export default function MapPage() {
  return (
    <ComingSoon
      title="Búsqueda en el mapa"
      description="Estamos afinando la experiencia de mapa con pins de propiedades y «buscar en esta zona»."
      phase="fase 1"
    />
  );
}
