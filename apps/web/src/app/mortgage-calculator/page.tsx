import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { MortgageCalculator } from "@/components/tools/mortgage-calculator";

export const metadata: Metadata = {
  title: "Calculadora hipotecaria",
  description:
    "Estima tu cuota mensual según el precio de la propiedad, el inicial, la tasa y el plazo. Cálculo informativo.",
  alternates: { canonical: "/mortgage-calculator" },
};

export default function MortgageCalculatorPage() {
  return (
    <Container size="narrow" className="py-12 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Calcula tu cuota</h1>
      <p className="mt-2 text-muted-foreground">
        Una estimación rápida para orientar tu búsqueda.
      </p>
      <div className="mt-8">
        <MortgageCalculator />
      </div>
    </Container>
  );
}
