import Link from "next/link";
import Image from "next/image";
import { Building2Icon } from "lucide-react";
import { ROUTES } from "@paradise/config";
import type { Agency, AgencySummary } from "@paradise/types";

import { VerifiedBadge } from "@/components/common/verified-badge";

export function AgencyCard({ agency }: { agency: Agency | AgencySummary }) {
  return (
    <Link
      href={ROUTES.agency(agency.slug)}
      className="group flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4 transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-border hover:shadow-card-hover"
    >
      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
        {agency.logoUrl ? (
          <Image src={agency.logoUrl} alt={agency.name} fill sizes="56px" className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-muted-foreground">
            <Building2Icon className="size-5" />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-medium">
          {agency.name}
          {agency.isVerified && <VerifiedBadge iconOnly className="p-0.5" />}
        </p>
        {agency.city && <p className="text-sm text-muted-foreground">{agency.city}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          <span>{agency.activeListings} propiedades</span>
          {agency.agentCount > 0 && <span>{agency.agentCount} asesores</span>}
        </div>
      </div>
    </Link>
  );
}
