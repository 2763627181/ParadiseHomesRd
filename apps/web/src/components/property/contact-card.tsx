"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, PhoneIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";
import { formatResponseTime, initials } from "@paradise/utils/format";
import { propertyInquiryMessage } from "@paradise/utils/whatsapp";
import type { Property } from "@paradise/types";

import { env } from "@/lib/env";
import { analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PriceDisplay } from "@/components/common/price-display";
import { VerifiedBadge } from "@/components/common/verified-badge";
import { FavoriteButton } from "@/components/common/favorite-button";
import { LeadForm } from "@/components/lead/lead-form";
import { WhatsappButton } from "@/components/lead/whatsapp-button";
import { ScheduleVisitDialog } from "@/components/lead/schedule-visit-dialog";

export function ContactCard({
  property,
  className,
}: {
  property: Property;
  className?: string;
}) {
  const [leadOpen, setLeadOpen] = React.useState(false);
  const [visitOpen, setVisitOpen] = React.useState(false);

  const agent = property.agent;
  const phone = agent?.whatsapp ?? agent?.phone ?? env.ADMIN_WHATSAPP;
  const propertyUrl = `${env.APP_URL}${ROUTES.property(property.slug)}`;
  const waMessage = propertyInquiryMessage({
    code: property.code,
    title: property.title,
    url: propertyUrl,
  });

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <PriceDisplay price={property.price} className="text-2xl" />
        {property.isVerified && <VerifiedBadge iconOnly />}
      </div>

      {agent && (
        <Link
          href={ROUTES.agent(agent.slug)}
          className="mt-4 flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-secondary"
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
            <p className="truncate text-xs text-muted-foreground">
              {property.agency?.name ?? agent.agencyName}
            </p>
            {formatResponseTime(agent.responseTimeMinutes) && (
              <p className="text-xs text-verified">
                {formatResponseTime(agent.responseTimeMinutes)}
              </p>
            )}
          </div>
        </Link>
      )}

      <div className="mt-4 space-y-2">
        <Button size="lg" className="w-full" onClick={() => setLeadOpen(true)}>
          Solicitar información
        </Button>
        <WhatsappButton
          phone={phone}
          message={waMessage}
          propertyId={property.id}
          agentId={agent?.id}
        />
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => setVisitOpen(true)}
        >
          <CalendarIcon className="size-4" />
          Agendar visita
        </Button>
        <div className="flex gap-2">
          {agent?.phone && (
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() =>
                analytics.track("phone_clicked", { propertyId: property.id, agentId: agent.id })
              }
            >
              <a href={`tel:+1${agent.phone}`}>
                <PhoneIcon className="size-4" />
                Llamar
              </a>
            </Button>
          )}
          <FavoriteButton
            id={property.id}
            slug={property.slug}
            title={property.title}
            variant="inline"
            className="size-11 flex-1"
          />
        </div>
      </div>

      <p className="mt-4 text-center text-[0.7rem] leading-relaxed text-muted-foreground">
        Código {property.code}. Paradise Homes RD no procesa el pago del inmueble.
      </p>

      <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar información</DialogTitle>
          </DialogHeader>
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-secondary p-3">
            {property.coverImage && (
              <Image
                src={property.coverImage.url}
                alt=""
                width={56}
                height={56}
                className="size-14 rounded-md object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{property.title}</p>
              <PriceDisplay price={property.price} compact className="text-sm" />
            </div>
          </div>
          <LeadForm
            propertyId={property.id}
            propertyCode={property.code}
            agentId={agent?.id}
            agencyId={property.agency?.id}
            defaultMessage={`Hola, me interesa la propiedad ${property.code}. Quisiera más información.`}
            onSuccess={() => setTimeout(() => setLeadOpen(false), 2500)}
          />
        </DialogContent>
      </Dialog>

      <ScheduleVisitDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        propertyId={property.id}
        propertyCode={property.code}
        agentId={agent?.id}
        propertyTitle={property.title}
      />
    </div>
  );
}
