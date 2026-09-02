import type { Metadata } from "next";

import { listAgencies } from "@/lib/data/people";
import { Container } from "@/components/layout/container";
import { AgencyCard } from "@/components/agency/agency-card";

export const metadata: Metadata = {
  title: "Inmobiliarias verificadas en República Dominicana",
  description:
    "Directorio de inmobiliarias y brokers verificados que operan en Paradise Homes RD.",
  alternates: { canonical: "/agencies" },
};

export default async function AgenciesPage() {
  const agencies = await listAgencies();

  return (
    <Container className="py-8 lg:py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inmobiliarias</h1>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          Firmas con inventario verificado y equipos de asesores en Paradise Homes RD.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} />
        ))}
      </div>
    </Container>
  );
}
