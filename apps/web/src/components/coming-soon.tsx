import Link from "next/link";
import { ArrowLeftIcon, HammerIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description?: string;
  phase?: string;
}) {
  return (
    <Container className="flex min-h-[55vh] flex-col items-center justify-center py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent-subtle text-accent-foreground">
        <HammerIcon className="size-5" />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {description ?? "Esta sección está en construcción y llegará muy pronto."}
      </p>
      {phase && <p className="mt-1 text-xs text-muted-foreground">Planificado para {phase}.</p>}
      <Button asChild variant="outline" className="mt-6">
        <Link href="/">
          <ArrowLeftIcon className="size-4" />
          Volver al inicio
        </Link>
      </Button>
    </Container>
  );
}
