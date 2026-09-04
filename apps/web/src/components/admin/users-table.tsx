import { formatDateRd } from "@paradise/utils/datetime";

import type { AdminUserRow } from "@/lib/data/admin";
import { Badge } from "@/components/ui/badge";

const ROLE_LABEL: Record<string, string> = {
  USER: "Usuario",
  AGENT: "Agente",
  AGENCY_ADMIN: "Admin. inmobiliaria",
  DEVELOPER: "Desarrolladora",
  DEVELOPER_ADMIN: "Admin. desarrolladora",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
};

const ROLE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "verified"
> = {
  USER: "outline",
  AGENT: "secondary",
  AGENCY_ADMIN: "warning",
  DEVELOPER: "secondary",
  DEVELOPER_ADMIN: "warning",
  ADMIN: "success",
  SUPER_ADMIN: "verified",
};

export function UsersTable({ rows }: { rows: AdminUserRow[] }) {
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
            <th className="px-4 py-2.5 text-left font-medium">Usuario</th>
            <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Correo</th>
            <th className="px-4 py-2.5 text-left font-medium">Rol</th>
            <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Alta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">
          {rows.map((row) => (
            <tr key={row.id} className="align-top hover:bg-secondary/30">
              <td className="px-4 py-3">
                <p className="line-clamp-1 font-medium">{row.fullName}</p>
                {row.isDemo && (
                  <Badge variant="outline" className="mt-1 text-[0.65rem]">
                    demo
                  </Badge>
                )}
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                {row.email ?? "—"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={ROLE_VARIANT[row.role] ?? "outline"}>
                  {ROLE_LABEL[row.role] ?? row.role}
                </Badge>
              </td>
              <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                {formatDateRd(row.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
