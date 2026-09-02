import Link from "next/link";
import {
  Building2Icon,
  CalendarCheckIcon,
  GemIcon,
  PalmtreeIcon,
  SailboatIcon,
  SparklesIcon,
  SunsetIcon,
  TrendingUpIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { LIFESTYLE_CATEGORIES, ROUTES } from "@paradise/config";
import type { PropertySearchParams } from "@paradise/types";

import { serializeSearchParams } from "@/lib/search-params";
import { Container } from "@/components/layout/container";
import { SectionHeading } from "@/components/section-heading";

const ICONS: Record<string, LucideIcon> = {
  Sailboat: SailboatIcon,
  TrendingUp: TrendingUpIcon,
  CalendarCheck: CalendarCheckIcon,
  Building2: Building2Icon,
  Gem: GemIcon,
  Users: UsersIcon,
  Sunset: SunsetIcon,
  Palmtree: PalmtreeIcon,
};

function categoryHref(filters: Record<string, unknown>): string {
  return `${ROUTES.properties()}${serializeSearchParams(filters as Partial<PropertySearchParams>)}`;
}

export function LifestyleGrid() {
  return (
    <section className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          title="Busca por estilo de vida"
          description="¿Qué buscas realmente en tu próximo hogar?"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LIFESTYLE_CATEGORIES.map((category) => {
            const Icon = ICONS[category.icon] ?? SparklesIcon;
            return (
              <Link
                key={category.slug}
                href={categoryHref(category.filters)}
                className="group flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent-subtle text-accent-foreground">
                  <Icon className="size-[1.15rem]" />
                </span>
                <p className="mt-1 text-sm font-medium">{category.label}</p>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
