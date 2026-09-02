"use client";

import * as React from "react";
import { CalendarIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";
import { buildWhatsappUrl, propertyInquiryMessage } from "@paradise/utils/whatsapp";
import type { Property } from "@paradise/types";

import { env } from "@/lib/env";
import { analytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PriceDisplay } from "@/components/common/price-display";
import { LeadForm } from "@/components/lead/lead-form";
import { ScheduleVisitDialog } from "@/components/lead/schedule-visit-dialog";

export function MobilePropertyCta({ property }: { property: Property }) {
  const [open, setOpen] = React.useState(false);
  const [visitOpen, setVisitOpen] = React.useState(false);

  const agent = property.agent;
  const phone = agent?.whatsapp ?? agent?.phone ?? env.ADMIN_WHATSAPP;
  const propertyUrl = `${env.APP_URL}${ROUTES.property(property.slug)}`;
  const waHref = buildWhatsappUrl({
    phone,
    message: propertyInquiryMessage({ code: property.code, title: property.title, url: propertyUrl }),
  });

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 glass px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <PriceDisplay price={property.price} className="text-lg" />
            <p className="text-[0.7rem] text-muted-foreground">{property.code}</p>
          </div>
          <Button size="lg" onClick={() => setOpen(true)}>
            Contactar
          </Button>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{property.title}</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-2 gap-2 px-5">
            <Button
              asChild
              variant="outline"
              className="col-span-2 h-12"
              onClick={() =>
                analytics.track("whatsapp_clicked", {
                  propertyId: property.id,
                  agentId: agent?.id,
                })
              }
            >
              <a href={waHref} target="_blank" rel="noreferrer">
                <MessageCircleIcon className="size-4" />
                WhatsApp
              </a>
            </Button>
            {agent?.phone && (
              <Button
                asChild
                variant="outline"
                className="h-12"
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
            <Button
              variant="outline"
              className="h-12"
              onClick={() => {
                setOpen(false);
                setVisitOpen(true);
              }}
            >
              <CalendarIcon className="size-4" />
              Agendar visita
            </Button>
          </div>
          <div className="px-5 py-4">
            <LeadForm
              compact
              propertyId={property.id}
              propertyCode={property.code}
              agentId={agent?.id}
              agencyId={property.agency?.id}
              defaultMessage={`Hola, me interesa la propiedad ${property.code}.`}
              onSuccess={() => setTimeout(() => setOpen(false), 2500)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <ScheduleVisitDialog
        open={visitOpen}
        onOpenChange={setVisitOpen}
        propertyId={property.id}
        propertyCode={property.code}
        agentId={agent?.id}
        propertyTitle={property.title}
      />
    </>
  );
}
