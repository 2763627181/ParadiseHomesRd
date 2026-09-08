import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GlobeIcon, MapPinIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";
import { agentContactMessage } from "@paradise/utils/whatsapp";

import {
  getAgencyAgents,
  getAgencyBySlug,
  getAgencyProperties,
  listAgencies,
} from "@/lib/data/people";
import { env } from "@/lib/env";
import { agencyJsonLd, JsonLd } from "@/lib/seo";
import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { WhatsappButton } from "@/components/lead/whatsapp-button";
import { PropertyCard } from "@/components/property/property-card";
import { AgentCard } from "@/components/agent/agent-card";
import { EmptyState } from "@/components/common/empty-state";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await listAgencies()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) return {};
  return {
    title: `${agency.name} — Inmobiliaria`,
    description: agency.description ?? `${agency.name}, inmobiliaria verificada en Paradise Homes RD.`,
    alternates: { canonical: ROUTES.agency(slug) },
  };
}

export default async function AgencyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = await getAgencyBySlug(slug);
  if (!agency) notFound();

  const [properties, agents] = await Promise.all([
    getAgencyProperties(agency.id),
    getAgencyAgents(slug),
  ]);

  return (
    <>
      <JsonLd
        data={agencyJsonLd({
          name: agency.name,
          slug,
          description: agency.description,
          logoUrl: agency.logoUrl,
          website: agency.website,
          phone: agency.phone,
        })}
      />
      <section className="relative border-b border-border/70">
        {agency.coverImageUrl && (
          <div className="relative h-44 w-full overflow-hidden sm:h-56">
            <Image src={agency.coverImageUrl} alt="" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}
        <Container className="-mt-12 pb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl border-4 border-background bg-secondary">
              {agency.logoUrl && (
                <Image src={agency.logoUrl} alt={agency.name} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                {agency.name}
                {agency.isVerified && <VerifiedBadge />}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {agency.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPinIcon className="size-4" />
                    {agency.city}
                  </span>
                )}
                {agency.website && (
                  <a href={agency.website} className="inline-flex items-center gap-1 hover:text-foreground">
                    <GlobeIcon className="size-4" />
                    Sitio web
                  </a>
                )}
                <span>{agency.activeListings} propiedades</span>
                <span>{agency.agentCount} asesores</span>
              </div>
            </div>
            <WhatsappButton
              phone={agency.whatsapp ?? agency.phone ?? env.ADMIN_WHATSAPP}
              message={agentContactMessage({ agentName: agency.name })}
              label="Contactar"
              variant="default"
              fullWidth={false}
            />
          </div>
        </Container>
      </section>

      <Container className="py-8 lg:py-10">
        {agency.description && (
          <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
            {agency.description}
          </p>
        )}

        <Separator className="my-8" />

        <h2 className="mb-4 text-lg font-semibold">Propiedades ({properties.length})</h2>
        {properties.length === 0 ? (
          <EmptyState title="Sin propiedades activas por ahora." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {agents.length > 0 && (
          <>
            <Separator className="my-8" />
            <h2 className="mb-4 text-lg font-semibold">Equipo ({agents.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </>
        )}
      </Container>
    </>
  );
}
