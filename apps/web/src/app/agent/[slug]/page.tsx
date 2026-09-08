import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GlobeIcon, LanguagesIcon, MapPinIcon, StarIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";
import { formatResponseTime, initials } from "@paradise/utils/format";
import { agentContactMessage } from "@paradise/utils/whatsapp";

import { getAgentBySlug, getAgentProperties, listAgents } from "@/lib/data/people";
import { getAgentReviews } from "@/lib/data/reviews";
import { env } from "@/lib/env";
import { AgentReviews } from "@/components/agent/agent-reviews";
import { agentJsonLd, JsonLd } from "@/lib/seo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Container } from "@/components/layout/container";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { WhatsappButton } from "@/components/lead/whatsapp-button";
import { PropertyCard } from "@/components/property/property-card";
import { EmptyState } from "@/components/common/empty-state";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await listAgents()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) return {};
  return {
    title: `${agent.fullName} — ${agent.agencyName ?? "Asesor inmobiliario"}`,
    description:
      agent.bio ?? `${agent.fullName}, asesor inmobiliario en República Dominicana. ${agent.activeListings} propiedades activas.`,
    alternates: { canonical: ROUTES.agent(slug) },
  };
}

export default async function AgentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);
  if (!agent) notFound();
  const [properties, reviews] = await Promise.all([
    getAgentProperties(agent.id),
    getAgentReviews(agent.id),
  ]);

  return (
    <>
    <JsonLd
      data={agentJsonLd({
        fullName: agent.fullName,
        slug,
        bio: "bio" in agent ? agent.bio : null,
        avatarUrl: agent.avatarUrl,
        agencyName: agent.agencyName,
        ratingAverage: agent.ratingAverage,
        ratingCount: agent.ratingCount,
        areas: "areas" in agent ? agent.areas : [],
      })}
    />
    <Container className="py-8 lg:py-12">
      <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border/70 bg-card p-6">
            <Avatar className="size-20">
              {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.fullName} />}
              <AvatarFallback>{initials(agent.fullName)}</AvatarFallback>
            </Avatar>
            <h1 className="mt-3 flex items-center gap-2 text-xl font-semibold">
              {agent.fullName}
              {agent.isVerified && <VerifiedBadge iconOnly />}
            </h1>
            <p className="text-sm text-muted-foreground">
              {agent.title}
              {agent.agencyName ? ` · ${agent.agencyName}` : ""}
            </p>

            <dl className="mt-4 space-y-2 text-sm">
              {agent.ratingAverage != null && (
                <div className="flex items-center gap-2">
                  <StarIcon className="size-4 fill-accent text-accent" />
                  {agent.ratingAverage.toFixed(1)} · {agent.ratingCount} reseñas
                </div>
              )}
              {formatResponseTime(agent.responseTimeMinutes) && (
                <div className="text-verified">{formatResponseTime(agent.responseTimeMinutes)}</div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <LanguagesIcon className="size-4" />
                {agent.languages.join(", ")}
              </div>
              {agent.areas.length > 0 && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                  {agent.areas.join(" · ")}
                </div>
              )}
              {"website" in agent && agent.socialLinks?.website && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GlobeIcon className="size-4" />
                  <a href={agent.socialLinks.website} className="hover:text-foreground">
                    Sitio web
                  </a>
                </div>
              )}
            </dl>

            <div className="mt-5">
              <WhatsappButton
                phone={agent.whatsapp ?? agent.phone ?? env.ADMIN_WHATSAPP}
                message={agentContactMessage({ agentName: agent.fullName })}
                label="Contactar por WhatsApp"
                variant="default"
                agentId={agent.id}
              />
            </div>
          </div>
        </aside>

        <div>
          {"bio" in agent && agent.bio && (
            <section className="mb-8">
              <h2 className="mb-2 text-lg font-semibold">Sobre {agent.fullName.split(" ")[0]}</h2>
              <p className="text-[0.95rem] leading-relaxed text-muted-foreground">{agent.bio}</p>
            </section>
          )}

          <h2 className="mb-4 text-lg font-semibold">
            Propiedades ({properties.length})
          </h2>
          {properties.length === 0 ? (
            <EmptyState title="Este asesor no tiene propiedades activas ahora mismo." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}

          <AgentReviews
            agentId={agent.id}
            agentSlug={slug}
            reviews={reviews}
            average={agent.ratingAverage}
            count={agent.ratingCount}
          />
        </div>
      </div>
    </Container>
    </>
  );
}
