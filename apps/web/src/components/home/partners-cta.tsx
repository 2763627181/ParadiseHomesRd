import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "Leads con atribución completa",
  "Visibilidad en las zonas de mayor demanda",
  "Analytics de tu inventario",
  "CRM ligero y seguimiento de visitas",
  "Propiedades verificadas por Paradise",
];

export function PartnersCta() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card p-8 sm:p-12 lg:grid lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-sm font-medium text-accent">Para inmobiliarias y desarrolladores</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
              Convierte tus propiedades en oportunidades.
            </h2>
            <p className="mt-3 text-[0.95rem] text-muted-foreground">
              Paradise Homes conecta tu inventario con compradores activamente interesados en
              República Dominicana.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={ROUTES.partnersApply()}>
                  Quiero ser partner
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={ROUTES.partners()}>Cómo funciona</Link>
              </Button>
            </div>
          </div>

          <ul className="mt-8 space-y-3 lg:mt-0">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
