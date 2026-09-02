"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Favoritos locales (sin login). Al autenticarse se sincronizan con
 * `/api/favorites/sync` y la fuente de verdad pasa a ser la tabla `favorites`.
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
  toggle: (entry: Omit<FavoriteEntry, "addedAt">) => boolean;
  add: (entry: Omit<FavoriteEntry, "addedAt">) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
  list: () => FavoriteEntry[];
  setHydrated: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: {},
      hydrated: false,
      toggle: (entry) => {
        const exists = Boolean(get().items[entry.id]);
        set((state) => {
          const next = { ...state.items };
          if (exists) delete next[entry.id];
          else next[entry.id] = { ...entry, addedAt: Date.now() };
          return { items: next };
        });
        return !exists;
      },
      add: (entry) =>
        set((state) => ({
          items: { ...state.items, [entry.id]: { ...entry, addedAt: Date.now() } },
        })),
      remove: (id) =>
        set((state) => {
          const next = { ...state.items };
          delete next[id];
          return { items: next };
        }),
      has: (id) => Boolean(get().items[id]),
      clear: () => set({ items: {} }),
      list: () =>
        Object.values(get().items).sort((a, b) => b.addedAt - a.addedAt),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "ph_favorites",
      version: 1,
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
