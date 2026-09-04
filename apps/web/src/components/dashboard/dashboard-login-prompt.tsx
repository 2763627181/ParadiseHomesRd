import Link from "next/link";
import { LogInIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Prompt de "inicia sesión" para secciones del panel de usuario que solo tienen sentido con cuenta. */
export function DashboardLoginPrompt({
  title = "Inicia sesión para ver esto",
  description = "Esta sección muestra información de tu cuenta, así que necesitas iniciar sesión primero.",
  next,
}: {
  title?: string;
  description?: string;
  next?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-subtle text-accent-foreground">
        <LogInIcon className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-5">
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}>Iniciar sesión</Link>
      </Button>
    </div>
  );
}
