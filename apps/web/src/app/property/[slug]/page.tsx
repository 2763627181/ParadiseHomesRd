import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import {
  CONDITION_LABELS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
  ROUTES,
} from "@paradise/config";
import { formatLocationLabel, specSummary } from "@paradise/utils/format";
import { formatPrice } from "@paradise/utils/currency";

import { getAllPropertySlugs, getPropertyBySlug } from "@/lib/data/properties";
import { breadcrumbJsonLd, JsonLd, propertyJsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/layout/container";
import { PriceDisplay } from "@/components/common/price-display";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { FavoriteButton } from "@/components/common/favorite-button";
import { FreshnessIndicator } from "@/components/common/freshness-indicator";
import { ShareButton } from "@/components/common/share-button";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertySpecs } from "@/components/property/property-specs";
import { PropertyAmenities } from "@/components/property/property-amenities";
import { PropertyLocationMap } from "@/components/property/property-location-map";
import { ContactCard } from "@/components/property/contact-card";
import { MobilePropertyCta } from "@/components/property/mobile-property-cta";
import { SimilarProperties } from "@/components/property/similar-properties";
import { PropertyViewTracker } from "@/components/property/property-view-tracker";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllPropertySlugs();
  return slugs.slice(0, 40).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) return {};

  const loc = formatLocationLabel(property.location);
  const price = property.price.onRequest
    ? "Precio a consultar"
    : formatPrice(property.price.amount, property.price.currency);
  const title = `${property.title} — ${price}`;
  const description = `${PROPERTY_TYPE_LABELS[property.propertyType]} en ${OPERATION_LABELS[property.operationType].toLowerCase()} en ${loc}. ${specSummary(property)}. ${property.description.slice(0, 120)}`;

  return {
    title,
    description,
    alternates: { canonical: ROUTES.property(slug) },
    openGraph: {
      type: "website",
      title: `${property.title} · Paradise Homes RD`,
      description,
      images: property.coverImage ? [{ url: property.coverImage.url }] : undefined,
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const loc = formatLocationLabel(property.location);
  const breadcrumb = [
    { name: "Inicio", path: "/" },
    { name: "Propiedades", path: "/properties" },
    ...(property.location.citySlug
      ? [{ name: property.location.city!, path: `/properties/${property.location.citySlug}` }]
      : []),
    { name: property.title, path: ROUTES.property(slug) },
  ];

  return (
    <>
      <JsonLd data={[propertyJsonLd(property), breadcrumbJsonLd(breadcrumb)]} />
      <PropertyViewTracker propertyId={property.id} slug={property.slug} agentId={property.agent?.id} />

      <Container className="py-5 lg:py-8">
        <nav
          aria-label="Migas de pan"
          className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          {breadcrumb.slice(0, -1).map((item) => (
            <span key={item.path} className="flex items-center gap-1">
              <Link href={item.path} className="hover:text-foreground">
                {item.name}
              </Link>
              <ChevronRightIcon className="size-3.5" />
            </span>
          ))}
          <span className="line-clamp-1 text-foreground">{property.title}</span>
        </nav>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{OPERATION_LABELS[property.operationType]}</Badge>
              <Badge variant="outline">{PROPERTY_TYPE_LABELS[property.propertyType]}</Badge>
              {property.conditionStatus && (
                <Badge variant="outline">{CONDITION_LABELS[property.conditionStatus]}</Badge>
              )}
              {property.isVerified && <VerifiedBadge />}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
              {property.title}
            </h1>
            <p className="mt-1 text-muted-foreground">{loc}</p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton
              title={property.title}
              url={`${env.APP_URL}${ROUTES.property(property.slug)}`}
              propertyId={property.id}
            />
            <FavoriteButton
              id={property.id}
              slug={property.slug}
              title={property.title}
              variant="inline"
            />
          </div>
        </div>

        <PropertyGallery images={property.images} title={property.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-8">
            <section>
              <div className="flex items-baseline justify-between gap-4">
                <PriceDisplay price={property.price} className="text-3xl" />
                <FreshnessIndicator lastVerifiedAt={property.lastVerifiedAt} />
              </div>
              <PropertySpecs
                variant="grid"
                className="mt-4"
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                parkingSpaces={property.parkingSpaces}
                constructionM2={property.constructionM2}
                landM2={property.landM2}
              />
            </section>

            <Separator />

            <section>
              <h2 className="mb-3 text-lg font-semibold">Descripción</h2>
              <div className="space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                {property.description.split("\n").filter(Boolean).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            {property.amenityKeys.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Características y amenidades</h2>
                  <PropertyAmenities keys={property.amenityKeys} />
                </section>
              </>
            )}

            <Separator />
            <section>
              <h2 className="mb-3 text-lg font-semibold">Ubicación</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                {property.location.hideExactLocation
                  ? `${loc}. La dirección exacta se comparte al contactar.`
                  : property.location.address ?? loc}
              </p>
              <PropertyLocationMap
                latitude={property.location.latitude}
                longitude={property.location.longitude}
                label={loc}
                approximate={property.location.hideExactLocation}
              />
            </section>

            {property.project && (
              <>
                <Separator />
                <section className="rounded-xl border border-border/70 bg-card p-5">
                  <p className="text-xs font-medium text-accent">Parte de un proyecto</p>
                  <h2 className="mt-1 text-lg font-semibold">{property.project.name}</h2>
                  {property.project.developerName && (
                    <p className="text-sm text-muted-foreground">
                      Desarrollado por {property.project.developerName}
                    </p>
                  )}
                  <Link
                    href={ROUTES.project(property.project.slug)}
                    className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                  >
                    Ver proyecto completo →
                  </Link>
                </section>
              </>
            )}
          </div>

          {/* Contact card sticky (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <ContactCard property={property} />
            </div>
          </aside>
        </div>
      </Container>

      <SimilarProperties property={property} />
      <MobilePropertyCta property={property} />
      <div className="h-16 md:hidden" />
    </>
  );
}
