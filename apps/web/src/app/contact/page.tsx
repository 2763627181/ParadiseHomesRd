import type { Metadata } from "next";
import { MessageCircleIcon } from "lucide-react";
import { CONTACT } from "@paradise/config";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { LeadForm } from "@/components/lead/lead-form";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Habla con el equipo de Paradise Homes RD por WhatsApp o déjanos un mensaje.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const wa = buildWhatsappUrl({
    phone: CONTACT.whatsapp,
    message: "Hola, quiero más información sobre Paradise Homes RD.",
  });

  return (
    <Container size="narrow" className="py-12 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contacto</h1>
      <p className="mt-2 text-muted-foreground">
        ¿Tienes dudas o quieres publicar tu inventario? Estamos para ayudarte.
      </p>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6">
        <p className="text-sm font-medium">Paradise Homes RD</p>
        <p className="mt-1 text-sm text-muted-foreground">{CONTACT.founderName}</p>
        <Button asChild className="mt-4">
          <a href={wa} target="_blank" rel="noreferrer">
            <MessageCircleIcon className="size-4" />
            Escribir por WhatsApp ({CONTACT.whatsappDisplay})
          </a>
        </Button>
      </div>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6">
        <h2 className="text-lg font-semibold">Envíanos un mensaje</h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">
          Te respondemos en el transcurso del día.
        </p>
        <LeadForm channel="contact_page" defaultMessage="" />
      </div>
    </Container>
  );
}
