import type { Metadata } from "next";

import { getSessionUser } from "@/lib/auth";
import { getCustomerProfile } from "@/lib/data/customer";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { DashboardLoginPrompt } from "@/components/dashboard/dashboard-login-prompt";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata: Metadata = { title: "Mi perfil", robots: { index: false } };
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

export default async function ProfilePage() {
  const user = await getSessionUser();

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Mi perfil</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Mantén tus datos de contacto al día para que los asesores puedan comunicarse contigo.
      </p>

      {!user ? <DashboardLoginPrompt next="/dashboard/profile" /> : <ProfileContent userId={user.id} />}
    </DashboardShell>
  );
}

async function ProfileContent({ userId }: { userId: string }) {
  const profile = await getCustomerProfile(userId);
  if (!profile) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center text-sm text-muted-foreground">
        No pudimos cargar tu perfil. Intenta de nuevo más tarde.
      </p>
    );
  }
  return <ProfileForm profile={profile} />;
}
