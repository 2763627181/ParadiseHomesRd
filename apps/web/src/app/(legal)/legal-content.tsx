import { Container } from "@/components/layout/container";
import { CONTACT, SITE } from "@paradise/config";

export const LEGAL_UPDATED = "8 de septiembre de 2026";

export function LegalPage({
  title,
  updated = LEGAL_UPDATED,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <Container size="prose" className="py-12 lg:py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Última actualización: {updated}</p>
      <div className="prose-ph mt-8 space-y-4 text-[0.95rem] leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
      <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
        Para consultas sobre este documento escríbenos a{" "}
        <a href={`mailto:${CONTACT.email}`} className="text-primary underline">
          {CONTACT.email}
        </a>{" "}
        o por WhatsApp al {CONTACT.whatsappDisplay}. {SITE.name} opera desde República Dominicana y
        este texto se rige por las leyes dominicanas.
      </p>
    </Container>
  );
}
