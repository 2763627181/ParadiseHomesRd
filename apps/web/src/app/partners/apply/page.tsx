import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PartnerApplicationForm } from "@/components/lead/partner-application-form";

export const metadata: Metadata = {
  title: "Aplica como partner",
  description: "Cuéntanos sobre tu empresa y tu inventario para unirte a Paradise Homes RD.",
  alternates: { canonical: "/partners/apply" },
};

export default function PartnerApplyPage() {
  return (
    <Container size="narrow" className="py-12 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Aplica como partner</h1>
      <p className="mt-2 text-muted-foreground">
        Completa el formulario y te contactamos en un máximo de 48 horas.
      </p>
      <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6">
        <PartnerApplicationForm />
      </div>
    </Container>
  );
}
