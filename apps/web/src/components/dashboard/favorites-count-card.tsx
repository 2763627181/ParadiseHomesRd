"use client";

import Link from "next/link";
import { HeartIcon } from "lucide-react";

import { useFavoritesStore } from "@/stores/favorites";

/** Tarjeta de conteo de favoritos — vive en el cliente porque los favoritos anónimos están en localStorage. */
export function FavoritesCountCard() {
  const count = useFavoritesStore((s) => Object.keys(s.items).length);
  return (
    <Link
      href="/dashboard/favorites"
      className="rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-border"
    >
      <HeartIcon className="size-4 text-muted-foreground" />
      <p className="mt-2 text-2xl font-semibold tabular-nums">{count}</p>
      <p className="text-xs text-muted-foreground">Favoritos</p>
    </Link>
  );
}
