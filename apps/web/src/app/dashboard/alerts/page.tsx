import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { getSavedSearchesForUser } from "@/lib/data/customer";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { AlertFrequencyManager } from "@/components/dashboard/saved-searches";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Alertas", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: "overview" },
  { label: "Favoritos", href: "/favorites", icon: "favorites" },
  { label: "Búsquedas guardadas", href: "/dashboard/searches", icon: "search" },
  { label: "Mis consultas", href: "/dashboard/inquiries", icon: "inbox" },
  { label: "Visitas", href: "/dashboard/visits", icon: "visits" },
  { label: "Alertas", href: "/dashboard/alerts", icon: "alerts" },
  { label: "Perfil", href: "/dashboard/profile", icon: "profile" },
];

export default async function AlertsPage() {
  const user = await getSessionUser();

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Alertas por correo</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Elige con qué frecuencia quieres que te avisemos de propiedades nuevas para cada búsqueda
        guardada.
      </p>

      {!user ? <DashboardLoginPrompt next="/dashboard/alerts" /> : <AlertsContent userId={user.id} />}
    </DashboardShell>
  );
}

async function AlertsContent({ userId }: { userId: string }) {
  const searches = await getSavedSearchesForUser(userId);

  if (searches.length === 0) {
    return (
      <EmptyState
        icon={BellIcon}
        title="No tienes búsquedas guardadas"
        description="Guarda una búsqueda desde /properties para poder configurar sus alertas por correo."
        action={
          <Button asChild>
            <Link href="/properties">Explorar propiedades</Link>
          </Button>
        }
      />
    );
  }

  return <AlertFrequencyManager searches={searches} />;
}
