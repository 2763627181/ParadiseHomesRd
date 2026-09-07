"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheckIcon,
  BarChart3Icon,
  BellIcon,
  BellRingIcon,
  HandshakeIcon,
  Building2Icon,
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  ConstructionIcon,
  FileTextIcon,
  HeartIcon,
  HomeIcon,
  IdCardIcon,
  LayersIcon,
  LayoutDashboardIcon,
  MegaphoneIcon,
  MenuIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  SearchIcon,
  SettingsIcon,
  TargetIcon,
  UploadIcon,
  UserPlusIcon,
  UserRoundIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboardIcon,
  home: HomeIcon,
  building: BuildingIcon,
  buildings: Building2Icon,
  leads: TargetIcon,
  calendar: CalendarIcon,
  messages: MessagesSquareIcon,
  inbox: MessageSquareIcon,
  analytics: BarChart3Icon,
  profile: UserRoundIcon,
  settings: SettingsIcon,
  favorites: HeartIcon,
  search: SearchIcon,
  visits: ClockIcon,
  alerts: BellIcon,
  users: UsersIcon,
  verify: BadgeCheckIcon,
  marketing: MegaphoneIcon,
  content: FileTextIcon,
  import: UploadIcon,
  agents: IdCardIcon,
  developers: ConstructionIcon,
  projects: LayersIcon,
  partners: UserPlusIcon,
  closings: HandshakeIcon,
  notifications: BellRingIcon,
};

export interface DashboardNavItem {
  label: string;
  href: string;
  /** clave de ícono (ver ICONS) */
  icon: keyof typeof ICONS | string;
}

export function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const isActive = (href: string) =>
    href === nav[0]?.href ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const navList = (
    <nav className="flex flex-col gap-0.5">
      {nav.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboardIcon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-background md:grid md:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar md:block">
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col p-4">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </p>
          {navList}
        </div>
      </aside>

      <div className="min-w-0">
        <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="Menú">
                <MenuIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>
                  <Logo href={null} />
                </SheetTitle>
              </SheetHeader>
              <div className="px-3 py-2">{navList}</div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">{title}</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
