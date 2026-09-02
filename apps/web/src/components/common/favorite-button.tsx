"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeartIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useFavoritesStore } from "@/stores/favorites";

interface FavoriteButtonProps {
  id: string;
  slug: string;
  kind?: "property" | "project";
  title?: string;
  variant?: "overlay" | "inline" | "ghost";
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({
  id,
  slug,
  kind = "property",
  title,
  variant = "overlay",
  size = "md",
  className,
}: FavoriteButtonProps) {
  const hydrated = useFavoritesStore((s) => s.hydrated);
  const isFav = useFavoritesStore((s) => Boolean(s.items[id]));
  const toggle = useFavoritesStore((s) => s.toggle);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggle({ id, slug, kind });
    analytics.track(added ? "favorite_added" : "favorite_removed", {
      propertyId: kind === "property" ? id : undefined,
      projectId: kind === "project" ? id : undefined,
      props: { slug },
    });
    toast(added ? "Guardado en favoritos" : "Quitado de favoritos", {
      description: added && title ? title : undefined,
    });
  };

  const dims = size === "sm" ? "size-8" : "size-9";
  const icon = size === "sm" ? "size-[1.05rem]" : "size-[1.15rem]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isFav}
      aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      className={cn(
        "group/fav inline-flex items-center justify-center rounded-full transition-[transform,background-color,color] duration-150 active:scale-90",
        dims,
        variant === "overlay" &&
          "bg-background/85 text-foreground shadow-sm backdrop-blur hover:bg-background",
        variant === "inline" && "border border-border bg-background hover:bg-secondary",
        variant === "ghost" && "hover:bg-secondary",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isFav ? "on" : "off"}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeartIcon
            className={cn(
              icon,
              hydrated && isFav
                ? "fill-[var(--destructive)] text-[var(--destructive)]"
                : "text-current",
            )}
          />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
