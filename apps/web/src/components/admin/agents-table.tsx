import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon, StarIcon } from "lucide-react";

import type { AdminAgentRow } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";

export function AgentsTable({ rows }: { rows: AdminAgentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        Sin resultados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Agente</th>
            <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Inmobiliaria</th>
            <th className="px-4 py-2.5 text-left font-medium">Rating</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
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
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                    {row.isDemo && (
                      <Badge variant="outline" className="mt-1 text-[0.65rem]">
                        demo
                      </Badge>
                    )}
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                {row.agencyName ?? "Independiente"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.ratingAverage != null ? (
                  <span className="inline-flex items-center gap-1">
                    <StarIcon className="size-3.5 fill-warning text-warning" />
                    {row.ratingAverage.toFixed(1)}
                    <span className="text-muted-foreground/70">({row.ratingCount})</span>
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                {row.isVerified ? (
                  <Badge variant="verified">Verificado</Badge>
                ) : (
                  <Badge variant="outline">Sin verificar</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Button asChild variant="ghost" size="icon-sm" title="Ver perfil público">
                    <Link href={`/agent/${row.slug}`} target="_blank">
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  </Button>
                  <AdminDeleteButton kind="agent" id={row.id} name={row.fullName} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
