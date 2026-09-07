import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { PROJECT_STATUS } from "@paradise/config";
import { formatDateRd } from "@paradise/utils/datetime";

import type { DeveloperProjectRow } from "@/lib/data/developer-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  [PROJECT_STATUS.PRE_SALE]: "En preventa",
  [PROJECT_STATUS.UNDER_CONSTRUCTION]: "En construcción",
  [PROJECT_STATUS.READY]: "Listo para entrega",
  [PROJECT_STATUS.DELIVERED]: "Entregado",
  [PROJECT_STATUS.SOLD_OUT]: "Vendido",
};

export function DeveloperProjectsTable({ rows }: { rows: DeveloperProjectRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        Aún no tienes proyectos publicados.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium">Proyecto</th>
            <th className="px-4 py-2.5 text-left font-medium">Unidades</th>
            <th className="px-4 py-2.5 text-left font-medium">Etapa</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Creado</th>
            <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-secondary/30">
              <td className="px-4 py-3">
                <p className="line-clamp-1 font-medium">{row.name}</p>
                <p className="text-xs text-muted-foreground">
                  {row.code} · /{row.slug}
                </p>
                {row.isVerified && (
                  <Badge variant="verified" className="mt-1 text-[0.65rem]">
                    Verificado
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {row.unitCount} unidad{row.unitCount === 1 ? "" : "es"}
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">{STATUS_LABEL[row.status] ?? row.status}</Badge>
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                {formatDateRd(row.createdAt)}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end">
                  <Button asChild variant="ghost" size="icon-sm" title="Ver">
                    <Link href={`/project/${row.slug}`} target="_blank">
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
