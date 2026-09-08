import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getUserInquiries } from "@/lib/data/customer";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { CustomerInquiriesTable } from "@/components/dashboard/customer-inquiries-table";

export const metadata: Metadata = { title: "Mis consultas", robots: { index: false } };
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

export default async function InquiriesPage() {
  const user = await getSessionUser();

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Mis consultas</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        El estado de cada consulta que has enviado a un asesor sobre una propiedad o proyecto.
      </p>

      {!user ? <DashboardLoginPrompt next="/dashboard/inquiries" /> : <InquiriesContent userId={user.id} />}
    </DashboardShell>
  );
}

async function InquiriesContent({ userId }: { userId: string }) {
  const inquiries = await getUserInquiries(userId);
  return <CustomerInquiriesTable inquiries={inquiries} />;
}
