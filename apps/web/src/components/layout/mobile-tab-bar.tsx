"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, HomeIcon, MapIcon, SearchIcon, UserRoundIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS: { label: string; href: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { label: "Inicio", href: "/", icon: HomeIcon, match: (p) => p === "/" },
  { label: "Buscar", href: "/properties", icon: SearchIcon, match: (p) => p.startsWith("/properties") || p.startsWith("/property") },
  { label: "Mapa", href: "/map", icon: MapIcon, match: (p) => p.startsWith("/map") },
  { label: "Favoritos", href: "/favorites", icon: HeartIcon, match: (p) => p.startsWith("/favorites") },
  { label: "Perfil", href: "/dashboard", icon: UserRoundIcon, match: (p) => p.startsWith("/dashboard") },
];

/** Bottom navigation para usuarios en mobile. Oculta en dashboards y en scroll de detalle. */
export function MobileTabBar() {
  const pathname = usePathname();

  const hidden =
    pathname.startsWith("/agent/dashboard") ||
    pathname.startsWith("/agency/dashboard") ||
    pathname.startsWith("/developer/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/list-property");

  if (hidden) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 glass pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[0.68rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-5", active && "fill-primary/10")} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
