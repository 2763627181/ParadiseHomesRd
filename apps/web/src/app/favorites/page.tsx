import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { FavoritesList } from "@/components/favorites/favorites-list";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Las propiedades y proyectos que guardaste en Paradise Homes RD.",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <Container className="py-8 lg:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Favoritos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Se guardan en este dispositivo. Inicia sesión para sincronizarlos.
        </p>
      </header>
      <FavoritesList />
    </Container>
  );
}
