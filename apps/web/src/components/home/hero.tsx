import Image from "next/image";

import { Container } from "@/components/layout/container";
import { HeroSearch } from "@/components/search/hero-search";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=2000&q=75"
          alt="Residencia contemporánea en República Dominicana"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      <Container className="flex flex-col items-start pt-16 pb-10 sm:pt-24 lg:pt-28 lg:pb-16">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="size-1.5 rounded-full bg-verified" />
          Propiedades verificadas en toda República Dominicana
        </p>

        <h1 className="max-w-3xl text-balance text-display text-foreground">
          Encuentra tu hogar en República Dominicana.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Explora propiedades verificadas para comprar, alquilar o invertir. Conecta directo con
          inmobiliarias, desarrolladores y asesores.
        </p>

        <HeroSearch className="mt-8 max-w-3xl" />
      </Container>
    </section>
  );
}
