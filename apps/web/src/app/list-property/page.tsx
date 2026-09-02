import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = {
  title: "Publicar propiedad",
  description: "Publica tu propiedad en Paradise Homes RD.",
};

export default function ListPropertyPage() {
  return (
    <ComingSoon
      title="Publicar propiedad"
      description="El asistente de publicación en 8 pasos con autoguardado está en camino. Mientras tanto, escríbenos por WhatsApp y publicamos tu propiedad contigo."
      phase="fase 1"
    />
  );
}
