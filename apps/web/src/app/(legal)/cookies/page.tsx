import type { Metadata } from "next";

import { LegalPage } from "@/app/(legal)/legal-content";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Cómo Paradise Homes RD usa cookies y tecnologías similares.",
  alternates: { canonical: "/cookies" },
  robots: { index: false },
};

export default function CookiesPage() {
  return (
    <LegalPage title="Política de cookies" updated="[PENDIENTE]">
      <p>[PLACEHOLDER] Usamos cookies para recordar tus preferencias y medir el uso de la plataforma.</p>
      <h2>Cookies esenciales</h2>
      <p>[PLACEHOLDER] Sesión de usuario y preferencia de tema.</p>
      <h2>Cookies de atribución</h2>
      <p>
        [PLACEHOLDER] Guardamos el origen de tu visita (campaña, canal) durante 90 días para atribuir
        correctamente las consultas que generas.
      </p>
      <h2>Cookies de analítica y marketing</h2>
      <p>[PLACEHOLDER] Google Analytics, Meta Pixel, TikTok Pixel y PostHog, cuando están habilitados.</p>
    </LegalPage>
  );
}
