import type { Metadata } from "next";

import { LegalPage } from "@/app/(legal)/legal-content";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: "Cómo Paradise Homes RD recopila y usa tu información.",
  alternates: { canonical: "/privacy" },
  robots: { index: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidad" updated="[PENDIENTE]">
      <p>
        [PLACEHOLDER] Esta política describe cómo Paradise Homes RD recopila, utiliza y protege la
        información de las personas que usan la plataforma.
      </p>
      <h2>1. Información que recopilamos</h2>
      <p>
        [PLACEHOLDER] Datos de contacto que proporcionas al solicitar información sobre una propiedad
        (nombre, teléfono, correo), datos de navegación y de campañas (UTM, referrer), y favoritos y
        búsquedas guardadas.
      </p>
      <h2>2. Cómo usamos tu información</h2>
      <p>
        [PLACEHOLDER] Para conectarte con el asesor o la inmobiliaria de la propiedad, para dar
        seguimiento a tu consulta, para mejorar la plataforma y para medir el rendimiento de nuestras
        campañas.
      </p>
      <h2>3. Con quién compartimos tu información</h2>
      <p>
        [PLACEHOLDER] Con el agente, inmobiliaria o desarrollador de la propiedad que consultaste, y
        con proveedores de servicios tecnológicos (hosting, email, analítica).
      </p>
      <h2>4. Tus derechos</h2>
      <p>[PLACEHOLDER] Puedes solicitar acceso, corrección o eliminación de tus datos escribiéndonos.</p>
      <h2>5. Contacto</h2>
      <p>[PLACEHOLDER] Escríbenos a través de la página de contacto.</p>
    </LegalPage>
  );
}
