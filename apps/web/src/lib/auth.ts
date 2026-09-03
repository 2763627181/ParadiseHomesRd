import "server-only";

import { cache } from "react";
import type { SessionUser } from "@paradise/types";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Usuario de sesión resuelto (perfil + rol + membresías). `null` si no hay sesión. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_type, agency_id, developer_id, role, status")
    .eq("profile_id", user.id);

  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "Usuario",
    avatarUrl: profile?.avatar_url ?? null,
    role: profile?.role ?? "USER",
    agentId: agent?.id ?? null,
    memberships: (memberships ?? []).map((m) => ({
      organizationId: (m.agency_id ?? m.developer_id) as string,
      organizationType: m.organization_type as "agency" | "developer",
      organizationName: "",
      role: m.role,
      status: m.status,
    })),
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export function isStaffUser(user: SessionUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}

export function isAgencyUser(user: SessionUser | null): boolean {
  return (
    user?.role === "AGENCY_ADMIN" ||
    user?.role === "DEVELOPER_ADMIN" ||
    Boolean(user?.memberships.some((m) => m.role === "owner" || m.role === "admin"))
  );
}

