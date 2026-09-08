import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { formatRelativeRd } from "@paradise/utils/datetime";

import { getAllPostsAdmin } from "@/lib/data/blog";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Contenido · Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/admin", icon: "overview" },
  { label: "Propiedades", href: "/admin/properties", icon: "buildings" },
  { label: "Proyectos", href: "/admin/projects", icon: "projects" },
  { label: "Usuarios", href: "/admin/users", icon: "users" },
  { label: "Agentes", href: "/admin/agents", icon: "agents" },
  { label: "Inmobiliarias", href: "/admin/agencies", icon: "building" },
  { label: "Desarrolladoras", href: "/admin/developers", icon: "developers" },
  { label: "Leads", href: "/admin/leads", icon: "leads" },
  { label: "Verificaciones", href: "/admin/verifications", icon: "verify" },
  { label: "Solicitudes", href: "/admin/partners", icon: "partners" },
  { label: "Cierres", href: "/admin/closings", icon: "closings" },
  { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
  { label: "Marketing", href: "/admin/marketing", icon: "marketing" },
  { label: "Contenido", href: "/admin/content", icon: "content" },
  { label: "Ajustes", href: "/admin/settings", icon: "settings" },
];

const STATUS_META: Record<string, { label: string; variant: "outline" | "success" | "secondary" }> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  PUBLISHED: { label: "Publicado", variant: "success" },
  ARCHIVED: { label: "Archivado", variant: "secondary" },
};

export default async function AdminContentPage() {
  const posts = await getAllPostsAdmin();

  return (
    <DashboardShell title="Admin" nav={NAV}>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Contenido</h1>
        <Button asChild size="sm">
          <Link href="/admin/content/new">
            <PlusIcon className="size-4" />
            Nuevo artículo
          </Link>
        </Button>
      </div>
      <p className="mb-5 text-sm text-muted-foreground">
        Artículos y guías del blog. Se muestran en <code className="text-xs">/blog</code> al publicarse.
      </p>

      {posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
          Aún no hay artículos. Si acabas de ejecutar la migración 0013, crea el primero.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Título</th>
                <th className="px-4 py-2.5 text-left font-medium">Estado</th>
                <th className="px-4 py-2.5 text-left font-medium">Actualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {posts.map((p) => {
                const meta = STATUS_META[p.status] ?? STATUS_META.DRAFT!;
                return (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/content/${p.id}`} className="font-medium hover:underline">
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">/blog/{p.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeRd(p.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
