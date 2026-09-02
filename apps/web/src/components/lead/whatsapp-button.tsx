"use client";

import { MessageCircleIcon } from "lucide-react";
import { buildWhatsappUrl } from "@paradise/utils/whatsapp";

import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

interface WhatsappButtonProps {
  phone: string;
  message: string;
  label?: string;
  propertyId?: string;
  projectId?: string;
  agentId?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  fullWidth?: boolean;
}

export function WhatsappButton({
  phone,
  message,
  label = "Hablar por WhatsApp",
  propertyId,
  projectId,
  agentId,
  variant = "outline",
  size = "lg",
  className,
  fullWidth = true,
}: WhatsappButtonProps) {
  const href = buildWhatsappUrl({ phone, message });

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(fullWidth && "w-full", "gap-2", className)}
      onClick={() =>
        analytics.track("whatsapp_clicked", { propertyId, projectId, agentId, props: { phone } })
      }
    >
      <a href={href} target="_blank" rel="noreferrer">
        <MessageCircleIcon className="size-[1.15rem]" />
        {label}
      </a>
    </Button>
  );
}
