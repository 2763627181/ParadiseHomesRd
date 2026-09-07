"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, MessageSquareIcon } from "lucide-react";
import { toast } from "sonner";

import { getOrCreateConversationForLead } from "@/lib/actions/messaging";
import { Button } from "@/components/ui/button";

const THREAD_BASE = {
  agent: "/agent/dashboard/messages",
  buyer: "/dashboard/messages",
} as const;

/**
 * Abre (o crea) la conversación ligada a un lead y navega al hilo.
 * Autocontenido: úsalo en el detalle del lead (asesor) o en "Mis consultas" (cliente).
 */
export function StartConversationButton({
  leadId,
  variant = "buyer",
  label = "Enviar mensaje",
  size = "sm",
  buttonVariant = "outline",
  className,
}: {
  leadId: string;
  /** decide a qué bandeja navegar tras abrir la conversación */
  variant?: "agent" | "buyer";
  label?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const open = async () => {
    setPending(true);
    try {
      const res = await getOrCreateConversationForLead(leadId);
      if (res.ok && res.conversationId) {
        router.push(`${THREAD_BASE[variant]}/${res.conversationId}`);
      } else {
        toast.error(res.message ?? "No pudimos abrir la conversación");
        setPending(false);
      }
    } catch {
      toast.error("No pudimos abrir la conversación");
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant={buttonVariant}
      size={size}
      onClick={open}
      disabled={pending}
      className={className}
    >
      {pending ? <Loader2Icon className="size-4 animate-spin" /> : <MessageSquareIcon className="size-4" />}
      {label}
    </Button>
  );
}
