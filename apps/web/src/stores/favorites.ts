"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { setFavorite, type FavoriteRef } from "@/lib/actions/favorites";

/**
 * Favoritos locales (funcionan sin login). Al autenticarse, `FavoritesSyncProvider`
 * fusiona este store con la tabla `favorites` (una vez) y, de ahí en adelante,
 * cada toggle también escribe en el servidor (no-op silencioso si no hay sesión).
 */

interface FavoriteEntry {
  id: string;
  slug: string;
  kind: "property" | "project";
  addedAt: number;
}

interface FavoritesState {
  items: Record<string, FavoriteEntry>;
  hydrated: boolean;
  synced: boolean;
  toggle: (entry: Omit<FavoriteEntry, "addedAt">) => boolean;
  add: (entry: Omit<FavoriteEntry, "addedAt">) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  list: () => FavoriteEntry[];
  setHydrated: () => void;
  markSynced: () => void;
  mergeFromServer: (refs: FavoriteRef[]) => void;
}

function writeThrough(entry: { id: string; kind: "property" | "project" }, favorited: boolean) {
  void setFavorite({ id: entry.id, kind: entry.kind }, favorited).catch(() => {
    /* sin conexión o sin sesión: el store local sigue siendo válido */
  });
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: {},
      hydrated: false,
      synced: false,
      toggle: (entry) => {
        const exists = Boolean(get().items[entry.id]);
        set((state) => {
          const next = { ...state.items };
          if (exists) delete next[entry.id];
          else next[entry.id] = { ...entry, addedAt: Date.now() };
          return { items: next };
        });
        if (get().synced) writeThrough(entry, !exists);
        return !exists;
      },
      add: (entry) => {
        set((state) => ({
          items: { ...state.items, [entry.id]: { ...entry, addedAt: Date.now() } },
        }));
        if (get().synced) writeThrough(entry, true);
      },
      remove: (id) => {
        const entry = get().items[id];
        set((state) => {
          const next = { ...state.items };
          delete next[id];
          return { items: next };
        });
        if (entry && get().synced) writeThrough(entry, false);
      },
      has: (id) => Boolean(get().items[id]),
      clear: () => set({ items: {} }),
      list: () => Object.values(get().items).sort((a, b) => b.addedAt - a.addedAt),
      setHydrated: () => set({ hydrated: true }),
      markSynced: () => set({ synced: true }),
      mergeFromServer: (refs) =>
        set((state) => {
          const next = { ...state.items };
          for (const ref of refs) {
            next[ref.id] ??= { id: ref.id, slug: "", kind: ref.kind, addedAt: Date.now() };
          }
          return { items: next, synced: true };
        }),
    }),
    {
      name: "ph_favorites",
      version: 1,
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
