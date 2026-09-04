"use server";

import { getSessionUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface FavoriteRef {
  id: string;
  kind: "property" | "project";
}

/** Favoritos guardados en la DB para el usuario autenticado. `[]` si no hay sesión. */
export async function getServerFavorites(): Promise<FavoriteRef[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("property_id, project_id")
    .eq("user_id", user.id);
  if (error || !data) return [];

  return data
    .map((r: { property_id: string | null; project_id: string | null }) =>
      r.property_id
        ? { id: r.property_id, kind: "property" as const }
        : r.project_id
          ? { id: r.project_id, kind: "project" as const }
          : null,
    )
    .filter((r): r is FavoriteRef => r !== null);
}

/**
 * Guarda/quita un favorito para el usuario autenticado. No-op silencioso si no
 * hay sesión (el store local sigue siendo la fuente de verdad en ese caso).
 */
export async function setFavorite(ref: FavoriteRef, favorited: boolean): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return;

  const column = ref.kind === "property" ? "property_id" : "project_id";

  if (favorited) {
    await supabase
      .from("favorites")
      .upsert(
        { user_id: user.id, [column]: ref.id },
        { onConflict: `user_id,${column}`, ignoreDuplicates: true },
      );
  } else {
    await supabase.from("favorites").delete().eq("user_id", user.id).eq(column, ref.id);
  }
}

/**
 * Se llama una vez al detectar sesión: sube los favoritos guardados solo en
 * este dispositivo y devuelve la lista completa (unión) ya en el servidor.
 */
export async function mergeFavoritesOnLogin(localRefs: FavoriteRef[]): Promise<FavoriteRef[]> {
  const user = await getSessionUser();
  if (!user) return localRefs;

  const supabase = await getSupabaseServerClient();
  if (!supabase) return localRefs;

  const existing = await getServerFavorites();
  const existingIds = new Set(existing.map((r) => `${r.kind}:${r.id}`));
  const missing = localRefs.filter((r) => !existingIds.has(`${r.kind}:${r.id}`));

  if (missing.length) {
    await supabase.from("favorites").insert(
      missing.map((r) => ({
        user_id: user.id,
        property_id: r.kind === "property" ? r.id : null,
        project_id: r.kind === "project" ? r.id : null,
      })),
    );
  }

  return [...existing, ...missing];
}
