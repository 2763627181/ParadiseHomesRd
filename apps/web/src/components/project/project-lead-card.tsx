"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@paradise/config";
import { formatPriceRange } from "@paradise/utils/currency";
import { initials } from "@paradise/utils/format";
import type { Currency } from "@paradise/config";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { VerifiedBadge } from "@/components/common/verified-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadForm } from "@/components/lead/lead-form";
import { WhatsappButton } from "@/components/lead/whatsapp-button";

export interface ProjectLeadAgent {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

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
  agent,
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
  agent?: ProjectLeadAgent | null;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {agent && (
        <>
          <Link
            href={ROUTES.agent(agent.slug)}
            className="-mx-2 -mt-1 mb-3 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-secondary"
          >
            <Avatar className="size-11">
              {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.fullName} />}
              <AvatarFallback>{initials(agent.fullName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-sm font-medium">
                {agent.fullName}
                {agent.isVerified && <VerifiedBadge iconOnly className="p-0.5" />}
              </p>
              <p className="text-xs text-muted-foreground">Asesor asignado</p>
            </div>
          </Link>
          <Separator className="mb-3" />
        </>
      )}

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
          agentId={agent?.id}
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
            agentId={agent?.id}
            defaultMessage={`Hola, quiero información sobre el proyecto ${projectName} (${projectCode}).`}
            onSuccess={() => setTimeout(() => setOpen(false), 2500)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
