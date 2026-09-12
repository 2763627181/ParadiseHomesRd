"use client";

import * as React from "react";
import Image from "next/image";
import { formatPriceRange } from "@paradise/utils/currency";
import type { Currency } from "@paradise/config";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadForm } from "@/components/lead/lead-form";
import { WhatsappButton } from "@/components/lead/whatsapp-button";

/**
 * Tarjeta de contacto del proyecto (precio + WhatsApp + "Solicitar
 * información"). El formulario completo vive en un diálogo en vez de inline:
 * como es `sticky`, un formulario largo quedaba más alto que la pantalla y el
 * botón de enviar solo se veía bajando hasta el final de la página.
 */
export function ProjectLeadCard({
  priceFrom,
  priceTo,
  currency,
  waPhone,
  waMessage,
  projectId,
  projectCode,
  projectName,
  coverImageUrl,
}: {
  priceFrom: number | null;
  priceTo: number | null;
  currency: Currency;
  waPhone: string;
  waMessage: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  coverImageUrl?: string | null;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <p className="text-sm text-muted-foreground">Precios desde</p>
      <p className="text-2xl font-semibold">{formatPriceRange(priceFrom, null, currency)}</p>

      <div className="mt-4 space-y-2">
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          Solicitar información
        </Button>
        <WhatsappButton
          phone={waPhone}
          message={waMessage}
          label="Consultar por WhatsApp"
          projectId={projectId}
        />
      </div>

      <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
        Código {projectCode}. Paradise Homes RD no procesa el pago del inmueble.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar información</DialogTitle>
          </DialogHeader>
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-secondary p-3">
            {coverImageUrl && (
              <Image
                src={coverImageUrl}
                alt=""
                width={56}
                height={56}
                className="size-14 rounded-md object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{projectName}</p>
              <p className="text-sm text-muted-foreground">
                {formatPriceRange(priceFrom, priceTo, currency)}
              </p>
            </div>
          </div>
          <LeadForm
            projectId={projectId}
            defaultMessage={`Hola, quiero información sobre el proyecto ${projectName} (${projectCode}).`}
            onSuccess={() => setTimeout(() => setOpen(false), 2500)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
