import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { formatRelativeRd } from "@paradise/utils/datetime";

import type { AgencyAgentRow } from "@/lib/data/agency-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AgencyAgentsTable({ rows }: { rows: AgencyAgentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        Aún no tienes asesores registrados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Asesor</th>
            <th className="px-4 py-2.5 text-left font-medium">Propiedades activas</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Desde</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-secondary/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                    {row.avatarUrl && (
                      <Image src={row.avatarUrl} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium">{row.fullName}</p>
                    <p className="text-xs text-muted-foreground">{row.title ?? "Asesor inmobiliario"}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.activeListings} propiedad{row.activeListings === 1 ? "" : "es"}
              </td>
              <td className="px-4 py-3">
                {row.isVerified ? (
                  <Badge variant="verified">Verificado</Badge>
                ) : (
                  <Badge variant="outline">Sin verificar</Badge>
                )}
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                {formatRelativeRd(row.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Button asChild variant="ghost" size="icon-sm" title="Ver perfil público">
                    <Link href={`/agent/${row.slug}`} target="_blank">
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
