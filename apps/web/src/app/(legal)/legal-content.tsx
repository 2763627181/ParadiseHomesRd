import { Container } from "@/components/layout/container";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <Container size="prose" className="py-12 lg:py-16">
      <div className="mb-6 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
        <strong>Borrador.</strong> Este texto es un marcador de posición y no constituye un documento
        legal definitivo. Debe ser revisado y aprobado por asesoría legal antes de su publicación.
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Última actualización: {updated}</p>
      <div className="prose-ph mt-8 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
        {children}
      </div>
    </Container>
  );
}
