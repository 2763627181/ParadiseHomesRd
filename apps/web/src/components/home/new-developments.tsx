import { ROUTES } from "@paradise/config";

import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/section-heading";
import { ProjectCard } from "@/components/project/project-card";
import { getFeaturedProjects } from "@/lib/data/projects";

export async function NewDevelopments() {
  const projects = await getFeaturedProjects(4);
  if (projects.length === 0) return null;

  return (
    <section className="bg-card py-12 sm:py-16">
      <Container>
        <SectionHeading
          title="Nuevos desarrollos"
          description="Obra nueva y preventa con planes de pago durante la construcción."
          action={{ label: "Ver proyectos", href: ROUTES.projects() }}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} priority={i < 2} />
          ))}
        </div>
      </Container>
    </section>
  );
}
