import type { Metadata } from "next";
import { BadgeCheckIcon, MessageCircleIcon } from "lucide-react";
import { CONTACT } from "@paradise/config";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";

import { Container } from "@/components/layout/container";
import { ListPropertyWizard } from "@/components/list-property/wizard";

export const metadata: Metadata = {
  title: "Publicar propiedad",
  description:
    "Publica tu propiedad en Paradise Homes RD: 8 pasos, autoguardado y revisión del equipo antes de salir al aire.",
  alternates: { canonical: "/list-property" },
};

export default function ListPropertyPage() {
  const wa = buildWhatsappUrl({
    phone: CONTACT.whatsapp,
    message: "Hola, quiero publicar una propiedad en Paradise Homes RD.",
  });

  return (
    <Container className="py-8 lg:py-12">
      <header className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Publica tu propiedad</h1>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          Completa los pasos, sube tus fotos y nuestro equipo la revisa antes de publicarla con el
          sello Paradise Verified.
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-verified">
          <BadgeCheckIcon className="size-4" />
          Gratis · sin comisión al publicar
        </div>
      </header>

      <ListPropertyWizard />

      <p className="mt-10 text-center text-sm text-muted-foreground">
        ¿Eres inmobiliaria con mucho inventario?{" "}
        <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
          <MessageCircleIcon className="size-3.5" />
          Escríbenos
        </a>{" "}
        y lo cargamos contigo.
      </p>
    </Container>
  );
}
