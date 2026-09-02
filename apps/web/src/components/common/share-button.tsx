"use client";

import * as React from "react";
import { CheckIcon, Share2Icon } from "lucide-react";
import { toast } from "sonner";

import { analytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export function ShareButton({
  title,
  url,
  text,
  propertyId,
  projectId,
}: {
  title: string;
  url: string;
  text?: string;
  propertyId?: string;
  projectId?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const onShare = async () => {
    analytics.track("share_clicked", { propertyId, projectId, props: { url } });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: text ?? title, url });
        return;
      } catch {
        /* usuario canceló */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Enlace copiado");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <Button variant="outline" size="icon" aria-label="Compartir" onClick={onShare}>
      {copied ? <CheckIcon className="size-[1.1rem]" /> : <Share2Icon className="size-[1.1rem]" />}
    </Button>
  );
}
