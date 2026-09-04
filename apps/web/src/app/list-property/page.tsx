import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheckIcon, MessageCircleIcon } from "lucide-react";
import { CONTACT } from "@paradise/config";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";

import { Container } from "@/components/layout/container";
import { ListPropertyWizard } from "@/components/list-property/wizard";
import { sbGetPropertyForEdit, type PropertyForEdit } from "@/lib/data/supabase/properties";
import type { WizardData, WizardImage } from "@/features/list-property/wizard-store";
import { getSessionUser, isAgencyUser, isStaffUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Publicar propiedad",
  description:
    "Publica tu propiedad en Paradise Homes RD: 8 pasos, autoguardado y revisión del equipo antes de salir al aire.",
  alternates: { canonical: "/list-property" },
};

/** Traduce la propiedad cargada del servidor al shape (strings) que usa el wizard. */
function buildEditSeed(record: PropertyForEdit): Partial<WizardData> {
  const { property } = record;
  const numStr = (v: number | null | undefined) => (v == null ? "" : String(v));

  const images: WizardImage[] = property.images.map((img) => ({
    id: img.id,
    url: img.url,
    storagePath: img.storagePath ?? "",
    isCover: img.isCover,
    alt: img.alt ?? "",
    uploading: false,
  }));

  return {
    operationType: property.operationType,
    propertyType: property.propertyType,
    conditionStatus: property.conditionStatus ?? "",
    provinceSlug: property.location.provinceSlug ?? "",
    citySlug: property.location.citySlug ?? "",
    sectorSlug: property.location.sectorSlug ?? "",
    address: property.location.address ?? "",
    latitude: property.location.latitude ?? undefined,
    longitude: property.location.longitude ?? undefined,
    hideExactLocation: property.location.hideExactLocation,
    title: property.title,
    description: property.description,
    bedrooms: numStr(property.bedrooms),
    bathrooms: numStr(property.bathrooms),
    parkingSpaces: numStr(property.parkingSpaces),
    constructionM2: numStr(property.constructionM2),
    landM2: numStr(property.landM2),
    yearBuilt: numStr(property.yearBuilt),
    floor: numStr(property.floor),
    totalFloors: numStr(property.totalFloors),
    priceOnRequest: Boolean(property.price.onRequest),
    price: numStr(property.price.amount),
    currency: property.price.currency,
    maintenanceFee: numStr(property.maintenanceFee?.amount ?? null),
    deliveryDate: "",
    amenityKeys: property.amenityKeys,
    furnished: property.furnished,
    petFriendly: property.petFriendly,
    airbnbFriendly: property.airbnbFriendly,
    images,
    videoUrl: property.video?.url ?? "",
    virtualTourUrl: property.virtualTourUrl ?? "",
    contactName: record.contactName,
    contactPhone: record.contactPhone,
    contactWhatsapp: record.contactWhatsapp,
    contactEmail: record.contactEmail,
    acceptTerms: true,
    website: "",
  };
}

export default async function ListPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;

  let editSeed: { id: string; data: Partial<WizardData> } | null = null;
  if (edit) {
    const record = await sbGetPropertyForEdit(edit);
    // OJO: `sbGetPropertyForEdit` usa el cliente con sesión, pero la política
    // RLS de lectura (`properties_public_read`) permite a CUALQUIERA leer una
    // propiedad PUBLISHED (así funciona la navegación pública) — por eso no
    // basta con "RLS ya filtró"; hay que re-verificar la autorización de
    // EDICIÓN explícitamente aquí, igual que `canEditProperty` en
    // `update-property-listing.ts`, o cualquier visitante anónimo vería el
    // formulario precargado con el teléfono/correo de contacto del dueño.
    const user = await getSessionUser();
    const authorized =
      !!record &&
      !!user &&
      (isStaffUser(user) ||
        record.ownerProfileId === user.id ||
        (user.agentId != null && record.agentId === user.agentId) ||
        (isAgencyUser(user) &&
          user.memberships.some(
            (m) => m.organizationType === "agency" && m.organizationId === record.agencyId,
          )));
    if (!record || !authorized) redirect("/agent/dashboard/properties");
    editSeed = { id: edit, data: buildEditSeed(record) };
  }

  const wa = buildWhatsappUrl({
    phone: CONTACT.whatsapp,
    message: "Hola, quiero publicar una propiedad en Paradise Homes RD.",
  });

  return (
    <Container className="py-8 lg:py-12">
      <header className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {editSeed ? "Edita tu propiedad" : "Publica tu propiedad"}
        </h1>
        <p className="mt-2 text-[0.95rem] text-muted-foreground">
          {editSeed
            ? "Actualiza los datos, precio o fotos. Los cambios se guardan directo en tu publicación."
            : "Completa los pasos, sube tus fotos y nuestro equipo la revisa antes de publicarla con el sello Paradise Verified."}
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-verified">
          <BadgeCheckIcon className="size-4" />
          Gratis · sin comisión al publicar
        </div>
      </header>

      <ListPropertyWizard editSeed={editSeed} />

      <p className="mt-10 text-center text-sm text-muted-foreground">
        ¿Eres inmobiliaria con mucho inventario?{" "}
        <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
          <MessageCircleIcon className="size-3.5" />
          Escríbenos
        </a>{" "}
        y lo cargamos contigo.
      </p>
    </Container>
  );
}
