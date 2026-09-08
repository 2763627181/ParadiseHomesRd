import Image from "next/image";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { formatDateRd } from "@paradise/utils/datetime";

import type { AdminAgencyRow } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDeleteButton } from "@/components/admin/admin-delete-button";

export function AgenciesTable({ rows }: { rows: AdminAgencyRow[] }) {
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
            <th className="px-4 py-2.5 text-left font-medium">Inmobiliaria</th>
            <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Ciudad</th>
            <th className="px-4 py-2.5 text-left font-medium">Agentes</th>
            <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Creada</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-secondary/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                    {row.logoUrl && (
                      <Image src={row.logoUrl} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-medium">{row.name}</p>
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
                {row.cityName ?? "—"}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.agentCount} agente{row.agentCount === 1 ? "" : "s"}
              </td>
              <td className="px-4 py-3">
                {row.isVerified ? (
                  <Badge variant="verified">Verificada</Badge>
                ) : (
                  <Badge variant="outline">Sin verificar</Badge>
                )}
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                {formatDateRd(row.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Button asChild variant="ghost" size="icon-sm" title="Ver perfil público">
                    <Link href={`/agency/${row.slug}`} target="_blank">
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  </Button>
                  <AdminDeleteButton kind="agency" id={row.id} name={row.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
