import type { Metadata } from "next";

import { listAgents } from "@/lib/data/people";
import { Container } from "@/components/layout/container";
import { AgentCard } from "@/components/agent/agent-card";

export const metadata: Metadata = {
  title: "Asesores inmobiliarios en República Dominicana",
  description:
    "Encuentra un asesor inmobiliario verificado por zona en Santo Domingo, Punta Cana, Santiago y más.",
  alternates: { canonical: "/agents" },
};

export default async function AgentsPage() {
  const agents = await listAgents();

  return (
    <Container className="py-8 lg:py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Asesores inmobiliarios</h1>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          Profesionales verificados que te acompañan en la búsqueda, la visita y la negociación.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </Container>
  );
}
