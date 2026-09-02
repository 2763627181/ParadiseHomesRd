"use client";

import Link from "next/link";
import { ClockIcon, HeartIcon, MessageSquareIcon, SearchIcon } from "lucide-react";

import { useFavoritesStore } from "@/stores/favorites";
import { DashboardShell, type DashboardNavItem } from "@/components/dashboard/dashboard-shell";

const NAV: DashboardNavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: "overview" },
  { label: "Favoritos", href: "/favorites", icon: "favorites" },
  { label: "Búsquedas guardadas", href: "/dashboard/searches", icon: "search" },
  { label: "Mis consultas", href: "/dashboard/inquiries", icon: "inbox" },
  { label: "Visitas", href: "/dashboard/visits", icon: "visits" },
  { label: "Alertas", href: "/dashboard/alerts", icon: "alerts" },
  { label: "Perfil", href: "/dashboard/profile", icon: "profile" },
];

export default function DashboardPage() {
  const favoritesCount = useFavoritesStore((s) => Object.keys(s.items).length);

  const cards = [
    { label: "Favoritos", value: favoritesCount, href: "/favorites", icon: HeartIcon },
    { label: "Búsquedas guardadas", value: 0, href: "/dashboard/searches", icon: SearchIcon },
    { label: "Consultas enviadas", value: 0, href: "/dashboard/inquiries", icon: MessageSquareIcon },
    { label: "Visitas agendadas", value: 0, href: "/dashboard/visits", icon: ClockIcon },
  ];

  return (
    <DashboardShell title="Mi cuenta" nav={NAV}>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Hola 👋</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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

      <div className="mt-8 rounded-xl border border-dashed border-border bg-card/50 p-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Tu actividad</p>
        <p className="mt-1">
          Cuando inicies sesión, aquí verás tus favoritos sincronizados, tus búsquedas guardadas con
          alertas, y el estado de cada consulta que envíes a un asesor.
        </p>
        <Link href="/properties" className="mt-3 inline-block font-medium text-primary hover:underline">
          Explorar propiedades →
        </Link>
      </div>
    </DashboardShell>
  );
}
