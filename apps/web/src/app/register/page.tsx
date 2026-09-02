import type { Metadata } from "next";

import { ComingSoon } from "@/components/coming-soon";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default function RegisterPage() {
  return <ComingSoon title="Crear cuenta" description="El registro de usuarios llega pronto." phase="fase 1" />;
}
