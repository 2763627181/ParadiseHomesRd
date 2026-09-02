import Link from "next/link";
import { CONTACT, FOOTER_COLUMNS, SITE, SOCIAL } from "@paradise/config";

import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

const SOCIAL_LINKS = [
  { label: "Instagram", href: SOCIAL.instagram },
  { label: "TikTok", href: SOCIAL.tiktok },
  { label: "Facebook", href: SOCIAL.facebook },
  { label: "YouTube", href: SOCIAL.youtube },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/70 bg-card">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo href={null} className="text-lg" />
            <p className="mt-3 text-sm text-muted-foreground">{SITE.tagline}</p>
            <p className="mt-4 text-sm text-muted-foreground">
              {CONTACT.founderName}
              <br />
              WhatsApp{" "}
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                className="text-foreground underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {CONTACT.whatsappDisplay}
              </a>
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border/70 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Todos los derechos reservados.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </Container>
    </footer>
  );
}
