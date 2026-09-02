import { BadgeCheckIcon, ClipboardCheckIcon, RefreshCwIcon, ShieldCheckIcon } from "lucide-react";

import { Container } from "@/components/layout/container";

const POINTS = [
  {
    icon: ClipboardCheckIcon,
    title: "Información revisada",
    description: "Precio, metros, características y ubicación validados antes de publicar.",
  },
  {
    icon: RefreshCwIcon,
    title: "Disponibilidad al día",
    description: "Confirmamos con el asesor que la propiedad sigue disponible.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Contraparte identificada",
    description: "Agente, inmobiliaria o desarrollador verificado y contactable.",
  },
];

export function VerifiedExplainer() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-verified/25 bg-verified/10 px-3 py-1 text-sm font-medium text-verified">
              <BadgeCheckIcon className="size-4" />
              Paradise Verified
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight sm:text-[1.85rem]">
              Menos sorpresas. Más confianza.
            </h2>
            <p className="mt-3 text-[0.95rem] text-muted-foreground">
              El sello Paradise Verified aparece cuando nuestro equipo revisa una publicación. No
              garantiza el estado legal del inmueble, pero sí que lo que ves es real y está
              disponible hoy.
            </p>
          </div>

          <ul className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {POINTS.map((point) => (
              <li
                key={point.title}
                className="flex gap-3 rounded-xl border border-border/70 bg-card p-4"
              >
                <point.icon className="size-5 shrink-0 text-verified" />
                <div>
                  <p className="text-sm font-medium">{point.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{point.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
