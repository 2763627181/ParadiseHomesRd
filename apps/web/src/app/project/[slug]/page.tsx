import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildingIcon, CalendarIcon, ChevronRightIcon, MapPinIcon } from "lucide-react";
import { PROJECT_STATUS, ROUTES } from "@paradise/config";
import { formatPriceRange } from "@paradise/utils/currency";
import { formatDateRd } from "@paradise/utils/datetime";
import { propertyInquiryMessage } from "@paradise/utils/whatsapp";

import { getAllProjectSlugs, getProjectBySlug } from "@/lib/data/projects";
import { JsonLd, breadcrumbJsonLd, projectJsonLd } from "@/lib/seo";
import { env } from "@/lib/env";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyAmenities } from "@/components/property/property-amenities";
import { PropertyLocationMap } from "@/components/property/property-location-map";
import { UnitTable } from "@/components/project/unit-table";
import { PaymentPlan } from "@/components/project/payment-plan";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { FavoriteButton } from "@/components/common/favorite-button";
import { WhatsappButton } from "@/components/lead/whatsapp-button";
import { LeadForm } from "@/components/lead/lead-form";

export const revalidate = 300;

const STATUS_LABEL: Record<string, string> = {
  [PROJECT_STATUS.PRE_SALE]: "En preventa",
  [PROJECT_STATUS.UNDER_CONSTRUCTION]: "En construcción",
  [PROJECT_STATUS.READY]: "Listo para entrega",
  [PROJECT_STATUS.DELIVERED]: "Entregado",
  [PROJECT_STATUS.SOLD_OUT]: "Vendido",
};

export async function generateStaticParams() {
  return (await getAllProjectSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.name} — ${project.location.city ?? project.location.sector}`,
    description: `${project.name}: ${project.description.slice(0, 150)}`,
    alternates: { canonical: ROUTES.project(slug) },
    openGraph: {
      title: `${project.name} · Paradise Homes RD`,
      description: project.description.slice(0, 200),
      images: project.coverImage ? [{ url: project.coverImage.url }] : undefined,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const location = [project.location.sector, project.location.city, project.location.province]
    .filter(Boolean)
    .join(", ");
  const defaultPlan = project.paymentPlans.find((p) => p.isDefault) ?? project.paymentPlans[0];
  const waPhone = project.developer?.whatsapp ?? env.ADMIN_WHATSAPP;

  return (
    <>
      <JsonLd
        data={[
          projectJsonLd(project),
          breadcrumbJsonLd([
            { name: "Inicio", path: "/" },
            { name: "Proyectos", path: "/projects" },
            { name: project.name, path: ROUTES.project(slug) },
          ]),
        ]}
      />

      <Container className="py-5 lg:py-8">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Inicio</Link>
          <ChevronRightIcon className="size-3.5" />
          <Link href="/projects" className="hover:text-foreground">Proyectos</Link>
          <ChevronRightIcon className="size-3.5" />
          <span className="text-foreground">{project.name}</span>
        </nav>

        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{STATUS_LABEL[project.status]}</Badge>
              {project.isVerified && <VerifiedBadge />}
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.9rem]">
              {project.name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
              <MapPinIcon className="size-4" />
              {location}
            </p>
          </div>
          <FavoriteButton
            id={project.id}
            slug={project.slug}
            kind="project"
            title={project.name}
            variant="inline"
          />
        </div>

        <PropertyGallery images={project.images} title={project.name} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-8">
            {/* Datos rápidos */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Fact label="Desde" value={formatPriceRange(project.priceFrom.amount, project.priceTo?.amount ?? null, project.priceFrom.currency)} />
              <Fact
                label="Habitaciones"
                value={project.bedroomsRange ? `${project.bedroomsRange[0]}–${project.bedroomsRange[1]}` : "—"}
              />
              <Fact label="Unidades disponibles" value={`${project.availableUnits} / ${project.totalUnits}`} />
              <Fact
                label="Entrega"
                value={project.deliveryEstimate ? formatDateRd(project.deliveryEstimate) : "Inmediata"}
                icon={<CalendarIcon className="size-4" />}
              />
            </div>

            <Separator />
            <section>
              <h2 className="mb-3 text-lg font-semibold">Sobre el proyecto</h2>
              <div className="space-y-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                {project.description.split("\n").filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {project.developer && (
                <div className="mt-4 flex items-center gap-3 rounded-lg border border-border/70 p-3">
                  {project.developer.logoUrl && (
                    <Image
                      src={project.developer.logoUrl}
                      alt={project.developer.name}
                      width={40}
                      height={40}
                      className="size-10 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">{project.developer.name}</p>
                    <Link
                      href={ROUTES.developer(project.developer.slug)}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver desarrolladora
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {project.amenityKeys.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Amenidades</h2>
                  <PropertyAmenities keys={project.amenityKeys} />
                </section>
              </>
            )}

            {project.buildings.length > 0 && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                    <BuildingIcon className="size-5" />
                    Edificios
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {project.buildings.map((b) => (
                      <span
                        key={b.id}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm"
                      >
                        {b.name} · {b.unitCount} unidades
                      </span>
                    ))}
                  </div>
                </section>
              </>
            )}

            <Separator />
            <section>
              <h2 className="mb-4 text-lg font-semibold">Inventario por unidad</h2>
              <UnitTable units={project.units} projectId={project.id} projectName={project.name} />
            </section>

            {defaultPlan && (
              <>
                <Separator />
                <section>
                  <h2 className="mb-4 text-lg font-semibold">Plan de pago</h2>
                  <PaymentPlan plan={defaultPlan} />
                </section>
              </>
            )}

            <Separator />
            <section>
              <h2 className="mb-3 text-lg font-semibold">Ubicación</h2>
              <PropertyLocationMap
                latitude={project.location.latitude}
                longitude={project.location.longitude}
                label={location}
              />
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-5 shadow-card">
              <p className="text-sm text-muted-foreground">Precios desde</p>
              <p className="text-2xl font-semibold">
                {formatPriceRange(project.priceFrom.amount, null, project.priceFrom.currency)}
              </p>
              <div className="mt-4 space-y-2">
                <WhatsappButton
                  phone={waPhone}
                  message={propertyInquiryMessage({
                    code: project.code,
                    title: project.name,
                    url: `${env.APP_URL}${ROUTES.project(project.slug)}`,
                  })}
                  label="Consultar por WhatsApp"
                  variant="default"
                  projectId={project.id}
                />
              </div>
              <Separator className="my-4" />
              <LeadForm
                compact
                projectId={project.id}
                defaultMessage={`Hola, quiero información sobre el proyecto ${project.name} (${project.code}).`}
              />
            </div>
          </aside>
        </div>
      </Container>

      {/* CTA móvil */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 glass px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">
              {formatPriceRange(project.priceFrom.amount, null, project.priceFrom.currency)}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">{project.availableUnits} disponibles</p>
          </div>
          <Button asChild size="lg">
            <a
              href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                propertyInquiryMessage({ code: project.code, title: project.name }),
              )}`}
              target="_blank"
              rel="noreferrer"
            >
              Consultar
            </a>
          </Button>
        </div>
      </div>
      <div className="h-16 md:hidden" />
    </>
  );
}

function Fact({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-3 py-2.5">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">{icon}{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
