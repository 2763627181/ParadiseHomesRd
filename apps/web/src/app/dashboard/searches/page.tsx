import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { getSavedSearchesForUser } from "@/lib/data/customer";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { SavedSearchesList } from "@/components/dashboard/saved-searches";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Búsquedas guardadas", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: "overview" },
  { label: "Favoritos", href: "/favorites", icon: "favorites" },
  { label: "Mensajes", href: "/dashboard/messages", icon: "messages" },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: "notifications" },
  { label: "Búsquedas guardadas", href: "/dashboard/searches", icon: "search" },
  { label: "Mis consultas", href: "/dashboard/inquiries", icon: "inbox" },
  { label: "Visitas", href: "/dashboard/visits", icon: "visits" },
  { label: "Alertas", href: "/dashboard/alerts", icon: "alerts" },
  { label: "Perfil", href: "/dashboard/profile", icon: "profile" },
];

export default async function SavedSearchesPage() {
  const user = await getSessionUser();

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Búsquedas guardadas</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Guarda tus filtros favoritos para volver a ellos rápido y recibir alertas de nuevas
        propiedades.
      </p>

      {!user ? (
        <DashboardLoginPrompt next="/dashboard/searches" />
      ) : (
        <SavedSearchesContent userId={user.id} />
      )}
    </DashboardShell>
  );
}

async function SavedSearchesContent({ userId }: { userId: string }) {
  const searches = await getSavedSearchesForUser(userId);

  if (searches.length === 0) {
    return (
      <EmptyState
        icon={SearchIcon}
        title="Aún no tienes búsquedas guardadas"
        description="Filtra propiedades por zona, precio o tipo en /properties y guarda esa búsqueda para volver a ella o recibir alertas."
        action={
          <Button asChild>
            <Link href="/properties">Explorar propiedades</Link>
          </Button>
        }
      />
    );
  }

  return <SavedSearchesList searches={searches} />;
}
