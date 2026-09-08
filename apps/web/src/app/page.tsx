import type { Metadata } from "next";
import { Suspense } from "react";

import { Hero } from "@/components/home/hero";
import { QuickSearches } from "@/components/home/quick-searches";
import { RecentlyViewedSection } from "@/components/home/recently-viewed-section";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { NewDevelopments } from "@/components/home/new-developments";
import { VerifiedExplainer } from "@/components/home/verified-explainer";
import { LifestyleGrid } from "@/components/home/lifestyle-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { PartnersCta } from "@/components/home/partners-cta";
import { Container } from "@/components/layout/container";
import { PropertyGridSkeleton } from "@/components/property/property-card-skeleton";

export const metadata: Metadata = {
  title: "Tu próximo hogar comienza aquí",
  description:
    "Descubre propiedades verificadas para comprar, alquilar o invertir en República Dominicana: Santo Domingo, Punta Cana, Santiago, Las Terrenas, Cap Cana y más.",
  alternates: { canonical: "/" },
};

function SectionFallback() {
  return (
    <Container className="py-10">
      <PropertyGridSkeleton count={3} />
    </Container>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={null}>
        <QuickSearches />
      </Suspense>
      <Suspense fallback={null}>
        <RecentlyViewedSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <FeaturedProperties />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <NewDevelopments />
      </Suspense>
      <VerifiedExplainer />
      <LifestyleGrid />
      <HowItWorks />
      <PartnersCta />
    </>
  );
}
