"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mergeFavoritesOnLogin } from "@/lib/actions/favorites";
import { useFavoritesStore } from "@/stores/favorites";

/**
 * Fusiona los favoritos guardados en este dispositivo con la tabla `favorites`
 * la primera vez que detecta una sesión activa. A partir de ahí, el store
 * escribe directo al servidor en cada toggle (ver stores/favorites.ts).
 */
export function FavoritesSyncProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const synced = useFavoritesStore((s) => s.synced);
  const mergeFromServer = useFavoritesStore((s) => s.mergeFromServer);
  const ranRef = React.useRef(false);

  React.useEffect(() => {
    if (!hydrated || synced || ranRef.current) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let cancelled = false;
    ranRef.current = true;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      const local = useFavoritesStore
        .getState()
        .list()
        .map((f) => ({ id: f.id, kind: f.kind }));
      const merged = await mergeFavoritesOnLogin(local);
      if (!cancelled) mergeFromServer(merged);
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, synced, mergeFromServer]);

  return <>{children}</>;
}
