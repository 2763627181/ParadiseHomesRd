import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas rápidas sobre cómo funciona Paradise Homes RD.",
  alternates: { canonical: "/faq" },
};

const FAQS = [
  {
    q: "¿Paradise Homes RD cobra por conectar con un asesor?",
    a: "No. Contactar una propiedad y hablar con el asesor es gratis para el comprador. Monetizamos con acuerdos comerciales con inmobiliarias y desarrolladores.",
  },
  {
    q: "¿Paradise procesa el pago de la propiedad?",
    a: "No. El cierre financiero ocurre directamente entre el comprador y la inmobiliaria, desarrollador o propietario. Nosotros conectamos y damos seguimiento.",
  },
  {
    q: "¿Qué significa el sello «Paradise Verified»?",
    a: "Que nuestro equipo revisó la publicación: precio, metros, características, disponibilidad y contacto. No es una garantía sobre el estado legal del inmueble.",
  },
  {
    q: "¿Cómo publico mi propiedad?",
    a: "Si eres inmobiliaria o desarrollador, aplica como partner. Si eres propietario autorizado, escríbenos por WhatsApp y te ayudamos a publicar.",
  },
  {
    q: "¿En qué zonas hay propiedades?",
    a: "Empezamos con Santo Domingo, Punta Cana, Santiago, Las Terrenas, Cap Cana, La Romana, Puerto Plata, Samaná, Juan Dolio, Jarabacoa y más zonas del país.",
  },
];

export default function FaqPage() {
  return (
    <Container size="narrow" className="py-12 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Preguntas frecuentes</h1>
      <Accordion type="single" collapsible className="mt-8">
        {FAQS.map((faq) => (
          <AccordionItem key={faq.q} value={faq.q}>
            <AccordionTrigger>{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: { "@type": "Answer", text: faq.a },
            })),
          }),
        }}
      />
    </Container>
  );
}
