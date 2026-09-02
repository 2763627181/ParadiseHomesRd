import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser } from "@/lib/auth";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect(next ?? "/dashboard");

  return (
    <Container size="narrow" className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo href="/" className="text-lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Es gratis y toma menos de un minuto.</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          {!isSupabaseConfigured && (
            <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
              El registro estará activo al conectar el backend.
            </p>
          )}
          <RegisterForm next={next} disabled={!isSupabaseConfigured} />
        </div>
      </div>
    </Container>
  );
}
