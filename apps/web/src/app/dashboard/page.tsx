import type { Metadata } from "next";
import Link from "next/link";
import { BellIcon, ClockIcon, MessageSquareIcon, SearchIcon } from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { getRecentlyViewedProperties } from "@/lib/data/collections";
import { getSavedSearchesForUser, getUserInquiries, getUserVisits } from "@/lib/data/customer";
import { getUnreadCount } from "@/lib/data/notifications";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";
import { FavoritesCountCard } from "@/components/dashboard/favorites-count-card";
import { PropertyCard } from "@/components/property/property-card";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };
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

export default async function DashboardPage() {
  const user = await getSessionUser();

  const [searches, inquiries, visits, unread, recent] = user
    ? await Promise.all([
        getSavedSearchesForUser(user.id),
        getUserInquiries(user.id),
        getUserVisits(user.id),
        getUnreadCount(user.id),
        getRecentlyViewedProperties(user.id, 6),
      ])
    : [[], [], [], 0, []];

  const cards = [
    { label: "Búsquedas guardadas", value: searches.length, href: "/dashboard/searches", icon: SearchIcon },
    { label: "Consultas enviadas", value: inquiries.length, href: "/dashboard/inquiries", icon: MessageSquareIcon },
    { label: "Visitas agendadas", value: visits.length, href: "/dashboard/visits", icon: ClockIcon },
    { label: "Sin leer", value: unread, href: "/dashboard/notifications", icon: BellIcon },
  ];

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        {user ? `Hola, ${user.fullName.split(" ")[0]} 👋` : "Hola 👋"}
      </h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <FavoritesCountCard />
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
            >
              <Icon className="size-4 text-muted-foreground" />
              <p className="mt-2 text-2xl font-semibold tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </Link>
          );
        })}
      </div>

      {recent.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Vistas recientemente</h2>
            <Link href="/properties" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {!user && (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Tu actividad</p>
          <p className="mt-1">
            Inicia sesión para ver tus favoritos sincronizados, tus búsquedas guardadas con alertas, y
            el estado de cada consulta que envíes a un asesor.
          </p>
          <Link href="/login?next=/dashboard" className="mt-3 inline-block font-medium text-primary hover:underline">
            Iniciar sesión →
          </Link>
        </div>
      )}
    </DashboardShell>
  );
}
