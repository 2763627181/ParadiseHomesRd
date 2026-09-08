import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getUserVisits } from "@/lib/data/customer";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { CustomerVisitsTable } from "@/components/dashboard/customer-visits-table";

export const metadata: Metadata = { title: "Mis visitas", robots: { index: false } };
export const dynamic = "force-dynamic";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: "overview" },
  { label: "Favoritos", href: "/dashboard/favorites", icon: "favorites" },
  { label: "Mensajes", href: "/dashboard/messages", icon: "messages" },
  { label: "Notificaciones", href: "/dashboard/notifications", icon: "notifications" },
  { label: "Búsquedas guardadas", href: "/dashboard/searches", icon: "search" },
  { label: "Mis consultas", href: "/dashboard/inquiries", icon: "inbox" },
  { label: "Visitas", href: "/dashboard/visits", icon: "visits" },
  { label: "Alertas", href: "/dashboard/alerts", icon: "alerts" },
  { label: "Perfil", href: "/dashboard/profile", icon: "profile" },
];

export default async function VisitsPage() {
  const user = await getSessionUser();

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Visitas</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Tus visitas agendadas a propiedades, con el contacto del asesor que te atiende.
      </p>

      {!user ? <DashboardLoginPrompt next="/dashboard/visits" /> : <VisitsContent userId={user.id} />}
    </DashboardShell>
  );
}

async function VisitsContent({ userId }: { userId: string }) {
  const visits = await getUserVisits(userId);
  return <CustomerVisitsTable visits={visits} />;
}
