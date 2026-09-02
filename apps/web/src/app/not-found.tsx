import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-medium text-accent">Error 404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Esta página no existe</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Puede que la propiedad ya no esté disponible o que el enlace haya cambiado.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/properties">Explorar propiedades</Link>
        </Button>
      </div>
    </Container>
  );
}
