"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, ShieldIcon, UserMinusIcon } from "lucide-react";
import { toast } from "sonner";

import { promoteToAdmin, revokeAdmin } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface StaffRow {
  id: string;
  fullName: string;
  email: string | null;
  role: string;
}

export function StaffManager({ staff, canManage }: { staff: StaffRow[]; canManage: boolean }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const promote = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    const res = await promoteToAdmin(email);
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Listo");
      setEmail("");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo");
    }
  };

  const revoke = async (id: string) => {
    if (!window.confirm("¿Quitar permisos de administrador a esta persona?")) return;
    setBusyId(id);
    const res = await revokeAdmin(id);
    setBusyId(null);
    if (res.ok) {
      toast.success(res.message ?? "Listo");
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo");
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <form onSubmit={promote} className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-card p-4">
          <div className="flex-1 min-w-[16rem] space-y-1.5">
            <label htmlFor="promote-email" className="text-xs font-medium text-muted-foreground">
              Promover a administrador (por correo)
            </label>
            <Input
              id="promote-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="persona@ejemplo.com"
              disabled={pending}
            />
          </div>
          <Button type="submit" size="sm" disabled={pending || !email.trim()}>
            {pending ? <Loader2Icon className="size-4 animate-spin" /> : <ShieldIcon className="size-4" />}
            Promover
          </Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border/70">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Nombre</th>
              <th className="px-4 py-2.5 text-left font-medium">Correo</th>
              <th className="px-4 py-2.5 text-left font-medium">Rol</th>
              {canManage && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium">{s.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.email ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={s.role === "SUPER_ADMIN" ? "verified" : "secondary"}>
                    {s.role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
                  </Badge>
                </td>
                {canManage && (
                  <td className="px-4 py-3 text-right">
                    {s.role === "ADMIN" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => revoke(s.id)}
                        disabled={busyId === s.id}
                      >
                        {busyId === s.id ? (
                          <Loader2Icon className="size-4 animate-spin" />
                        ) : (
                          <UserMinusIcon className="size-4" />
                        )}
                        Quitar
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!canManage && (
        <p className="text-xs text-muted-foreground">Solo un super admin puede promover o quitar administradores.</p>
      )}
    </div>
  );
}
