"use client";

import { ScaleIcon } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useCompareStore, MAX_COMPARE } from "@/stores/compare";

export function CompareButton({
  id,
  size = "md",
  className,
}: {
  id: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const active = useCompareStore((s) => s.ids.includes(id));
  const toggle = useCompareStore((s) => s.toggle);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = toggle(id);
    if (result === "full") {
      toast.error(`Puedes comparar hasta ${MAX_COMPARE} propiedades a la vez.`);
    } else if (result === "added") {
      toast.success("Añadido al comparador");
    }
  };

  const dims = size === "sm" ? "size-8" : "size-9";
  const icon = size === "sm" ? "size-[1rem]" : "size-[1.1rem]";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Quitar del comparador" : "Añadir al comparador"}
      title={active ? "Quitar del comparador" : "Comparar"}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors active:scale-90",
        active ? "text-primary" : "text-foreground hover:bg-background",
        dims,
        className,
      )}
    >
      <ScaleIcon className={cn(icon, active && "fill-primary/15")} />
    </button>
  );
}
