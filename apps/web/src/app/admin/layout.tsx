import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/env";
import { getSessionUser, isStaffUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // En modo demo (sin backend) se deja pasar para poder ver la UI.
  if (!isSupabaseConfigured) return <>{children}</>;

  const user = await getSessionUser();

  if (!isStaffUser(user)) {
    return (
      <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlertIcon className="size-5" />
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Acceso restringido</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          {user
            ? "Tu cuenta no tiene permisos de administrador."
            : "Inicia sesión con una cuenta de administrador."}
        </p>
        {!user && (
          <Button asChild className="mt-6">
            <Link href="/login?next=/admin">Iniciar sesión</Link>
          </Button>
        )}
        {user && (
          <p className="mt-6 max-w-md rounded-lg border border-border bg-card px-4 py-3 text-left text-xs text-muted-foreground">
            Para promover tu cuenta: en Supabase → SQL Editor ejecuta
            <br />
            <code className="mt-1 block rounded bg-secondary px-2 py-1">
              update profiles set role = &apos;SUPER_ADMIN&apos; where email = &apos;{user.email}&apos;;
            </code>
          </p>
        )}
      </Container>
    );
  }

  return <>{children}</>;
}
