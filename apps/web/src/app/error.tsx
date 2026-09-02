"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-medium text-accent">Algo salió mal</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">No pudimos cargar esta página</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Intenta de nuevo en un momento. Si el problema persiste, escríbenos.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground">Ref: {error.digest}</p>
      )}
    </Container>
  );
}
