import { CONDITION_LABELS, PROPERTY_TYPE_LABELS, SITE } from "@paradise/config";
import type { Project, Property } from "@paradise/types";

import { env } from "@/lib/env";

function abs(path: string): string {
  return `${env.APP_URL.replace(/\/$/, "")}${path}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: SITE.name,
    url: env.APP_URL,
    slogan: SITE.tagline,
    areaServed: { "@type": "Country", name: "República Dominicana" },
    knowsLanguage: ["es", "en"],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

export function propertyJsonLd(property: Property) {
  const images = property.images.slice(0, 8).map((img) => img.url);
  const priceValid = property.price.amount != null && !property.price.onRequest;

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description.slice(0, 500),
    url: abs(`/property/${property.slug}`),
    image: images,
    datePosted: property.publishedAt ?? property.createdAt,
    identifier: property.code,
    ...(property.location.latitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: property.location.latitude,
        longitude: property.location.longitude,
      },
    }),
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location.city ?? property.location.sector ?? undefined,
      addressRegion: property.location.province ?? undefined,
      addressCountry: "DO",
    },
    ...(priceValid && {
      offers: {
        "@type": "Offer",
        price: property.price.amount,
        priceCurrency: property.price.currency,
        availability: "https://schema.org/InStock",
        seller: property.agency
          ? { "@type": "RealEstateAgent", name: property.agency.name }
          : { "@type": "Organization", name: SITE.name },
      },
    }),
    ...(property.constructionM2 && {
      floorSize: { "@type": "QuantitativeValue", value: property.constructionM2, unitCode: "MTK" },
    }),
    numberOfRooms: property.bedrooms ?? undefined,
    numberOfBathroomsTotal: property.bathrooms ?? undefined,
    additionalType: `https://schema.org/${schemaResidenceType(property)}`,
    additionalProperty: [
      property.conditionStatus && {
        "@type": "PropertyValue",
        name: "Estado",
        value: CONDITION_LABELS[property.conditionStatus],
      },
      {
        "@type": "PropertyValue",
        name: "Tipo",
        value: PROPERTY_TYPE_LABELS[property.propertyType],
      },
    ].filter(Boolean),
  };
}

function schemaResidenceType(property: Property): string {
  switch (property.propertyType) {
    case "APARTMENT":
    case "PENTHOUSE":
      return "Apartment";
    case "HOUSE":
    case "VILLA":
      return "House";
    default:
      return "Residence";
  }
}

export function projectJsonLd(project: Project) {
  return {
    "@context": "https://schema.org",
    "@type": "ApartmentComplex",
    name: project.name,
    description: project.description.slice(0, 500),
    url: abs(`/project/${project.slug}`),
    image: project.images.slice(0, 6).map((i) => i.url),
    numberOfAvailableAccommodationUnits: project.availableUnits,
    numberOfAccommodationUnits: project.totalUnits,
    address: {
      "@type": "PostalAddress",
      addressLocality: project.location.city ?? undefined,
      addressRegion: project.location.province ?? undefined,
      addressCountry: "DO",
    },
    ...(project.priceFrom.amount && {
      makesOffer: {
        "@type": "Offer",
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: project.priceFrom.amount,
          maxPrice: project.priceTo?.amount ?? project.priceFrom.amount,
          priceCurrency: project.priceFrom.currency,
        },
      },
    }),
  };
}

export function agentJsonLd(agent: {
  fullName: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
  agencyName?: string | null;
  ratingAverage?: number | null;
  ratingCount?: number;
  areas?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agent.fullName,
    url: abs(`/agent/${agent.slug}`),
    description: agent.bio ?? undefined,
    image: agent.avatarUrl ?? undefined,
    worksFor: agent.agencyName ? { "@type": "Organization", name: agent.agencyName } : undefined,
    areaServed: (agent.areas ?? []).map((a) => ({ "@type": "Place", name: a })),
    ...(agent.ratingAverage != null && (agent.ratingCount ?? 0) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: agent.ratingAverage,
            reviewCount: agent.ratingCount,
            bestRating: 5,
          },
        }
      : {}),
  };
}

export function agencyJsonLd(agency: {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  phone?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agency.name,
    url: abs(`/agency/${agency.slug}`),
    description: agency.description ?? undefined,
    logo: agency.logoUrl ?? undefined,
    sameAs: agency.website ? [agency.website] : undefined,
    telephone: agency.phone ?? undefined,
    areaServed: { "@type": "Country", name: "República Dominicana" },
  };
}

export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  authorName: string;
  publishedAt?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.coverImageUrl ?? undefined,
    url: abs(`/blog/${post.slug}`),
    datePublished: post.publishedAt ?? undefined,
    author: { "@type": "Organization", name: post.authorName },
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <>
      {payload.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
