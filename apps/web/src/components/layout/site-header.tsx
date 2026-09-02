"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeartIcon, MenuIcon, SearchIcon } from "lucide-react";
import { PRIMARY_NAV } from "@paradise/config";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/user-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "glass border-b border-border/70 shadow-xs"
          : "border-b border-transparent bg-background",
      )}
    >
      <Container className="flex h-16 items-center gap-4 md:h-[4.5rem]">
        <Logo className="text-lg" />

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                isActive(item.href) && "text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Button asChild variant="outline" size="sm" className="hidden md:inline-flex">
            <Link href="/list-property">Publicar propiedad</Link>
          </Button>

          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            aria-label="Favoritos"
            className="hidden sm:inline-flex"
          >
            <Link href="/favorites">
              <HeartIcon className="size-[1.15rem]" />
            </Link>
          </Button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <div className="hidden lg:block">
            <UserMenu />
          </div>

          <Button
            asChild
            variant="ghost"
            size="icon-sm"
            aria-label="Buscar"
            className="lg:hidden"
          >
            <Link href="/properties">
              <SearchIcon className="size-[1.15rem]" />
            </Link>
          </Button>

          {/* Menú móvil */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Menú" className="lg:hidden">
                <MenuIcon className="size-[1.2rem]" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86%] gap-0 sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>
                  <Logo href={null} className="text-lg" />
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col px-3 py-2">
                {PRIMARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-3 py-3 text-[15px] font-medium transition-colors hover:bg-secondary",
                      isActive(item.href) ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <Separator className="my-2" />
              <div className="flex flex-col gap-2 px-4 py-2">
                <Button asChild variant="default">
                  <Link href="/list-property">Publicar propiedad</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login">Iniciar sesión</Link>
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between px-5 py-2">
                <span className="text-sm text-muted-foreground">Tema</span>
                <ThemeToggle align="end" />
              </div>
              <div className="mt-auto flex flex-col gap-1 px-5 py-4 text-sm text-muted-foreground">
                <Link href="/partners" className="py-1.5 hover:text-foreground">
                  ¿Eres inmobiliaria o desarrollador?
                </Link>
                <Link href="/contact" className="py-1.5 hover:text-foreground">
                  Contacto
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
