import type { Metadata } from "next";

import { listProjects } from "@/lib/data/projects";
import { Container } from "@/components/layout/container";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = {
  title: "Proyectos y obra nueva en República Dominicana",
  description:
    "Descubre proyectos inmobiliarios en preventa y construcción en Santo Domingo, Punta Cana, Santiago y Las Terrenas. Planes de pago flexibles durante la obra.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <Container className="py-8 lg:py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Proyectos y obra nueva
        </h1>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          Desarrollos verificados con planes de pago durante la construcción. Reserva desde planos y
          asegura precio de preventa.
        </p>
      </header>

      {projects.length === 0 ? (
        <EmptyState title="Aún no hay proyectos publicados" />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} priority={i < 3} />
          ))}
        </div>
      )}
    </Container>
  );
}
