import { HandshakeIcon, MessageCircleIcon, SearchIcon, type LucideIcon } from "lucide-react";
import { HOW_IT_WORKS } from "@paradise/config";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/section-heading";

const ICONS: Record<string, LucideIcon> = {
  Search: SearchIcon,
  MessageCircle: MessageCircleIcon,
  Handshake: HandshakeIcon,
};

export function HowItWorks() {
  return (
    <section className="bg-primary text-primary-foreground py-14 sm:py-20">
      <Container>
        <SectionHeading
          title="Cómo funciona Paradise"
          description="Del descubrimiento al cierre, sin intermediarios ocultos."
          className="[&_h2]:text-primary-foreground [&_p]:text-primary-foreground/70"
        />
        <ol className="grid gap-8 sm:grid-cols-3">
          {HOW_IT_WORKS.map((step, i) => {
            const Icon = ICONS[step.icon] ?? SearchIcon;
            return (
              <li key={step.title} className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium text-primary-foreground/60">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-primary-foreground/70">{step.description}</p>
              </li>
            );
          })}
        </ol>
        <p className="mt-10 max-w-2xl text-sm text-primary-foreground/60">
          Paradise Homes RD no procesa el pago del inmueble. El cierre financiero ocurre
          directamente entre comprador y vendedor. Nosotros te acompañamos y damos seguimiento.
        </p>
      </Container>
    </section>
  );
}
