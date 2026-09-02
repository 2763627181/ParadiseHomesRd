import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { GlobeIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";

import { getDeveloperBySlug, getDeveloperProjects } from "@/lib/data/people";
import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/common/empty-state";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) return {};
  return {
    title: `${developer.name} — Desarrolladora`,
    description:
      developer.description ?? `${developer.name}, desarrolladora inmobiliaria en República Dominicana.`,
    alternates: { canonical: ROUTES.developer(slug) },
  };
}

export default async function DeveloperPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const developer = await getDeveloperBySlug(slug);
  if (!developer) notFound();
  const projects = await getDeveloperProjects(slug);

  return (
    <Container className="py-8 lg:py-12">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {developer.logoUrl && (
            <Image src={developer.logoUrl} alt={developer.name} fill className="object-cover" />
          )}
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {developer.name}
            {developer.isVerified && <VerifiedBadge />}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
            <span>{developer.projectCount} proyectos</span>
            <span>{developer.deliveredUnits} unidades entregadas</span>
            {developer.website && (
              <a href={developer.website} className="inline-flex items-center gap-1 hover:text-foreground">
                <GlobeIcon className="size-4" />
                Sitio web
              </a>
            )}
          </div>
        </div>
      </div>

      {developer.description && (
        <p className="mt-6 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
          {developer.description}
        </p>
      )}

      <Separator className="my-8" />
      <h2 className="mb-4 text-lg font-semibold">Proyectos ({projects.length})</h2>
      {projects.length === 0 ? (
        <EmptyState title="Sin proyectos publicados por ahora." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </Container>
  );
}
