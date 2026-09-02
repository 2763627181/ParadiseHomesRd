import type { Metadata } from "next";

import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next ?? "/dashboard");

  return (
    <Container size="narrow" className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo href="/" className="text-lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guarda favoritos, búsquedas y da seguimiento a tus consultas.
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          {!isSupabaseConfigured && (
            <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              Las cuentas estarán activas al conectar el backend. Tus favoritos ya se guardan en este
              dispositivo.
            </p>
          )}
          <LoginForm next={next} disabled={!isSupabaseConfigured} />
        </div>
      </div>
    </Container>
  );
}
