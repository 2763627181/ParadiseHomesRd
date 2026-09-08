import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon, PencilIcon } from "lucide-react";
import {
  CONDITION_LABELS,
  OPERATION_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@paradise/config";
import { formatLocationLabel } from "@paradise/utils/format";

import { sbGetPropertyForEdit } from "@/lib/data/supabase/properties";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { PropertyModerationActions } from "@/components/admin/property-moderation-actions";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PriceDisplay } from "@/components/common/price-display";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertySpecs } from "@/components/property/property-specs";
import { PropertyAmenities } from "@/components/property/property-amenities";
import { PropertyLocationMap } from "@/components/property/property-location-map";

export const metadata: Metadata = { title: "Detalle de propiedad · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/admin", icon: "overview" },
  { label: "Propiedades", href: "/admin/properties", icon: "buildings" },
  { label: "Proyectos", href: "/admin/projects", icon: "projects" },
  { label: "Usuarios", href: "/admin/users", icon: "users" },
  { label: "Agentes", href: "/admin/agents", icon: "agents" },
  { label: "Inmobiliarias", href: "/admin/agencies", icon: "building" },
  { label: "Desarrolladoras", href: "/admin/developers", icon: "developers" },
  { label: "Leads", href: "/admin/leads", icon: "leads" },
  { label: "Verificaciones", href: "/admin/verifications", icon: "verify" },
  { label: "Solicitudes", href: "/admin/partners", icon: "partners" },
  { label: "Cierres", href: "/admin/closings", icon: "closings" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

const STATUS_META: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "secondary" | "outline" }> = {
  PENDING_REVIEW: { label: "En revisión", variant: "warning" },
  PUBLISHED: { label: "Publicada", variant: "success" },
  REJECTED: { label: "Rechazada", variant: "destructive" },
  DRAFT: { label: "Borrador", variant: "outline" },
  ARCHIVED: { label: "Archivada", variant: "secondary" },
};

export default async function AdminPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await sbGetPropertyForEdit(id);
  if (!record) notFound();

  const { property, status } = record;
  const loc = formatLocationLabel(property.location);
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT!;

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <div className="mb-5">
        <Link href="/admin/properties" className="text-sm text-muted-foreground hover:text-foreground">
          ← Volver a Propiedades
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground">{property.code}</span>
            <Badge variant="secondary">{OPERATION_LABELS[property.operationType]}</Badge>
            <Badge variant="outline">{PROPERTY_TYPE_LABELS[property.propertyType]}</Badge>
            {property.conditionStatus && (
              <Badge variant="outline">{CONDITION_LABELS[property.conditionStatus]}</Badge>
            )}
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{property.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{loc}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/list-property?edit=${property.id}`}>
              <PencilIcon className="size-4" />
              Editar
            </Link>
          </Button>
          {status === "PUBLISHED" && (
            <Button asChild variant="ghost" size="sm">
              <Link href={`/property/${property.slug}`} target="_blank">
                <ExternalLinkIcon className="size-4" />
                Ver público
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4">
        <PropertyModerationActions propertyId={property.id} status={status} title={property.title} />
        <AdminDeleteButton
          kind="property"
          id={property.id}
          name={property.title}
          redirectTo="/admin/properties"
        />
      </div>

      <div className="mt-6">
        <PropertyGallery images={property.images} title={property.title} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0 space-y-6">
          <section>
            <PriceDisplay price={property.price} className="text-2xl" />
            <PropertySpecs
              variant="grid"
              className="mt-3"
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              parkingSpaces={property.parkingSpaces}
              constructionM2={property.constructionM2}
              landM2={property.landM2}
            />
          </section>

          <Separator />
          <section>
            <h2 className="mb-2 text-sm font-semibold">Descripción</h2>
            <div className="space-y-2 text-[0.95rem] leading-relaxed text-muted-foreground">
              {property.description.split("\n").filter(Boolean).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>

          {property.amenityKeys.length > 0 && (
            <>
              <Separator />
              <section>
                <h2 className="mb-3 text-sm font-semibold">Amenidades</h2>
                <PropertyAmenities keys={property.amenityKeys} />
              </section>
            </>
          )}

          <Separator />
          <section>
            <h2 className="mb-2 text-sm font-semibold">Ubicación</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              {property.location.address ?? loc}
              {property.location.hideExactLocation && " · se muestra aproximada al público"}
            </p>
            <PropertyLocationMap
              latitude={property.location.latitude}
              longitude={property.location.longitude}
              label={loc}
            />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card p-4">
            <h2 className="mb-2 text-sm font-semibold">Contacto de la publicación</h2>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Nombre</dt>
                <dd>{record.contactName || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Teléfono</dt>
                <dd>{record.contactPhone || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">WhatsApp</dt>
                <dd>{record.contactWhatsapp || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Correo</dt>
                <dd className="break-all">{record.contactEmail || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border/70 bg-card p-4 text-sm">
            <h2 className="mb-2 text-sm font-semibold">Atribución</h2>
            <p className="text-xs text-muted-foreground">
              {record.agencyId ? "Publicada por una inmobiliaria" : record.agentId ? "Publicada por un agente" : "Publicada por un particular"}
              {" · "}
              {property.images.length} foto{property.images.length === 1 ? "" : "s"}
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
