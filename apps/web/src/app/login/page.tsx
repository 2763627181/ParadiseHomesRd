import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };

export default function LoginPage() {
  return (
    <ComingSoon
      title="Cuentas de usuario"
      description="El inicio de sesión con correo, Google y Apple llega en breve. Por ahora tus favoritos se guardan en este dispositivo."
      phase="fase 1"
    />
  );
}
