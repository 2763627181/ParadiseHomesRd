import Link from "next/link";
import Image from "next/image";
import { MapPinIcon, StarIcon } from "lucide-react";
import { ROUTES } from "@paradise/config";
import { formatResponseTime, initials } from "@paradise/utils/format";
import type { Agent, AgentSummary } from "@paradise/types";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/common/verified-badge";

export function AgentCard({ agent }: { agent: Agent | AgentSummary }) {
  return (
    <Link
      href={ROUTES.agent(agent.slug)}
      className="group flex gap-4 rounded-xl border border-border/70 bg-card p-4 transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover"
    >
      <Avatar className="size-16">
        {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.fullName} />}
        <AvatarFallback>{initials(agent.fullName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-medium">
          {agent.fullName}
          {agent.isVerified && <VerifiedBadge iconOnly className="p-0.5" />}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {agent.title ?? "Asesor inmobiliario"}
          {agent.agencyName ? ` · ${agent.agencyName}` : ""}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {agent.ratingAverage != null && (
            <span className="inline-flex items-center gap-1">
              <StarIcon className="size-3.5 fill-accent text-accent" />
              {agent.ratingAverage.toFixed(1)} ({agent.ratingCount})
            </span>
          )}
          <span>{agent.activeListings} propiedades</span>
          {formatResponseTime(agent.responseTimeMinutes) && (
            <span className="text-verified">{formatResponseTime(agent.responseTimeMinutes)}</span>
          )}
        </div>
        {agent.areas.length > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPinIcon className="size-3.5" />
            {agent.areas.slice(0, 2).join(" · ")}
          </p>
        )}
      </div>
    </Link>
  );
}
