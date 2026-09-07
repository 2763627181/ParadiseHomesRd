"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BuildingIcon,
  HeartIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react";
import type { UserRole } from "@paradise/config";
import { initials } from "@paradise/utils/format";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { analytics } from "@/lib/analytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MiniUser {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  role: UserRole;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = React.useState<MiniUser | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoaded(true);
      return;
    }
    let mounted = true;

    const load = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!authUser) {
        setUser(null);
        setLoaded(true);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, role")
        .eq("id", authUser.id)
        .maybeSingle();
      if (!mounted) return;
      setUser({
        id: authUser.id,
        email: profile?.email ?? authUser.email ?? null,
        fullName: profile?.full_name ?? authUser.user_metadata?.full_name ?? "Usuario",
        avatarUrl: profile?.avatar_url ?? null,
        role: (profile?.role as UserRole) ?? "USER",
      });
      analytics.identify(authUser.id);
      setLoaded(true);
    };

    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => void load());
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await getSupabaseBrowserClient()?.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (!loaded || !user) {
    return (
      <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex">
        <Link href="/login">Iniciar sesión</Link>
      </Button>
    );
  }

  const isStaff = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isAgent = user.role === "AGENT";
  const isAgency = user.role === "AGENCY_ADMIN" || user.role === "DEVELOPER_ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center rounded-full p-0.5 transition-colors hover:bg-secondary"
          aria-label="Mi cuenta"
        >
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
            <AvatarFallback className="text-xs">{initials(user.fullName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">{user.fullName}</p>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboardIcon /> Mi panel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/favorites">
            <HeartIcon /> Favoritos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile">
            <UserRoundIcon /> Perfil
          </Link>
        </DropdownMenuItem>

        {(isAgent || isAgency || isStaff) && <DropdownMenuSeparator />}
        {isAgent && (
          <DropdownMenuItem asChild>
            <Link href="/agent/dashboard">
              <SettingsIcon /> Panel de asesor
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "AGENCY_ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/agency/dashboard">
              <BuildingIcon /> Panel de inmobiliaria
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "DEVELOPER_ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/developer/dashboard">
              <BuildingIcon /> Panel de desarrolladora
            </Link>
          </DropdownMenuItem>
        )}
        {isStaff && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldIcon /> Admin
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => void signOut()}>
          <LogOutIcon /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
