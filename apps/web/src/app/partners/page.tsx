import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3Icon,
  BadgeCheckIcon,
  MegaphoneIcon,
  TargetIcon,
  UsersIcon,
  WorkflowIcon,
} from "lucide-react";
import { ROUTES } from "@paradise/config";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Partners — publica en Paradise",
  description:
    "Paradise Homes conecta tu inventario con compradores activamente interesados en República Dominicana. Leads con atribución, analytics y CRM ligero.",
  alternates: { canonical: "/partners" },
};

const FEATURES = [
  { icon: TargetIcon, title: "Leads calificados", description: "Cada consulta llega con su origen: campaña, canal y UTM completos." },
  { icon: MegaphoneIcon, title: "Visibilidad premium", description: "Tu inventario destacado en las zonas de mayor demanda del país." },
  { icon: BarChart3Icon, title: "Analytics accionable", description: "Qué se ve, qué convierte y qué zonas crecen — sin planillas." },
  { icon: WorkflowIcon, title: "CRM ligero", description: "Pipeline de leads, asignación a asesores y seguimiento de visitas." },
  { icon: BadgeCheckIcon, title: "Paradise Verified", description: "El sello que da confianza al comprador y acelera el cierre." },
  { icon: UsersIcon, title: "Equipo conectado", description: "Tus asesores con su propio panel, sus propiedades y sus leads." },
];

export default function PartnersPage() {
  return (
    <>
      <section className="border-b border-border/70 bg-card">
        <Container className="py-16 text-center lg:py-24">
          <p className="text-sm font-medium text-accent">Para inmobiliarias y desarrolladores</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance text-display">
            Convierte tus propiedades en oportunidades.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Paradise Homes conecta tu inventario con compradores activamente interesados en
            República Dominicana.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link href={ROUTES.partnersApply()}>Quiero ser partner</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={ROUTES.contact()}>Hablar con el equipo</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-border/70 bg-card p-5">
              <feature.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-medium">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-primary p-8 text-center text-primary-foreground sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight">¿Listo para empezar?</h2>
          <p className="mx-auto mt-2 max-w-md text-primary-foreground/70">
            Cuéntanos sobre tu empresa y tu inventario. Te contactamos en 48 horas.
          </p>
          <Button asChild size="lg" variant="accent" className="mt-6">
            <Link href={ROUTES.partnersApply()}>Aplicar ahora</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
