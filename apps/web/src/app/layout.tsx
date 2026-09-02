import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SITE } from "@paradise/config";

import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsScripts } from "@/components/analytics/analytics-scripts";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "bienes raíces República Dominicana",
    "apartamentos Santo Domingo",
    "villas Punta Cana",
    "comprar propiedad RD",
    "alquiler Santo Domingo",
    "proyectos inmobiliarios",
  ],
  authors: [{ name: SITE.name }],
  creator: SITE.name,
  openGraph: {
    type: "website",
    locale: "es_DO",
    url: env.APP_URL,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: SITE.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: SITE.themeColor.dark },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={cn(GeistSans.variable, GeistMono.variable)}>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <Providers>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
          >
            Saltar al contenido
          </a>
          <SiteHeader />
          <main id="contenido" className="pb-16 md:pb-0">
            {children}
          </main>
          <SiteFooter />
          <MobileTabBar />
          <Toaster />
        </Providers>
        <AnalyticsScripts />
      </body>
    </html>
  );
}
