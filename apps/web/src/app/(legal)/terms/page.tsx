import type { Metadata } from "next";

import { LegalPage } from "@/app/(legal)/legal-content";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Términos de uso de Paradise Homes RD.",
  alternates: { canonical: "/terms" },
  robots: { index: false },
};

export default function TermsPage() {
  return (
    <LegalPage title="Términos y condiciones" updated="[PENDIENTE]">
      <p>
        [PLACEHOLDER] Al usar Paradise Homes RD aceptas estos términos. La plataforma es un
        marketplace de descubrimiento inmobiliario.
      </p>
      <h2>1. Naturaleza del servicio</h2>
      <p>
        [PLACEHOLDER] Paradise Homes RD conecta a personas interesadas con inmobiliarias,
        desarrolladores y asesores. <strong>No procesamos el pago del inmueble</strong> ni somos parte
        de la transacción de compraventa o alquiler.
      </p>
      <h2>2. Contenido de las publicaciones</h2>
      <p>
        [PLACEHOLDER] La información de cada propiedad es responsabilidad de quien la publica. El sello
        Paradise Verified indica una revisión de nuestro equipo pero no constituye garantía legal.
      </p>
      <h2>3. Uso aceptable</h2>
      <p>[PLACEHOLDER] No se permite publicar información falsa, duplicada o engañosa.</p>
      <h2>4. Limitación de responsabilidad</h2>
      <p>[PLACEHOLDER] Pendiente de revisión legal.</p>
      <h2>5. Ley aplicable</h2>
      <p>[PLACEHOLDER] Estos términos se rigen por las leyes de la República Dominicana.</p>
    </LegalPage>
  );
}
