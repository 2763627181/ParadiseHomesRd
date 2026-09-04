"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const MAX_COMPARE = 4;

interface CompareState {
  ids: string[];
  hydrated: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
  setHydrated: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      has: (id) => get().ids.includes(id),
      toggle: (id) => {
        const { ids } = get();
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) });
          return "removed";
        }
        if (ids.length >= MAX_COMPARE) return "full";
        set({ ids: [...ids, id] });
        return "added";
      },
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "ph_compare",
      version: 1,
      partialize: (s) => ({ ids: s.ids }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
