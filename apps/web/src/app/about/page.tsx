import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@paradise/config";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description:
    "Paradise Homes RD es una plataforma inmobiliaria moderna que conecta compradores con inmobiliarias, desarrolladores y asesores en República Dominicana.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container size="narrow" className="py-12 lg:py-20">
      <h1 className="text-display">Tu próximo hogar comienza aquí.</h1>
      <div className="mt-6 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground">
        <p>
          Paradise Homes RD nació para hacer que descubrir una propiedad en República Dominicana se
          sienta simple, confiable y moderno. Reunimos en un solo lugar la oferta de inmobiliarias,
          desarrolladores, constructoras, brokers y propietarios autorizados.
        </p>
        <p>
          No procesamos el pago del inmueble: el cierre financiero ocurre directamente entre el
          comprador y la contraparte. Nuestro rol es conectar, dar confianza con el sello{" "}
          <strong className="text-foreground">Paradise Verified</strong> y acompañar el proceso con
          seguimiento real de cada consulta.
        </p>
        <p>
          Empezamos en República Dominicana, con la mirada puesta en crecer hacia toda la región.
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-border/70 bg-card p-6">
        <p className="text-sm font-medium">Contacto</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {CONTACT.founderName} · WhatsApp {CONTACT.whatsappDisplay}
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/contact">Escríbenos</Link>
        </Button>
      </div>
    </Container>
  );
}
