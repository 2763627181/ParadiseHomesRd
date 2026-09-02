"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Carrusel horizontal con scroll-snap. En mobile se desliza con el dedo;
 * en desktop aparecen flechas al hacer hover.
 */
export function PropertyCarousel({
  children,
  className,
  itemClassName,
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(true);

  const update = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  React.useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 520), behavior: "smooth" });
  };

  return (
    <div className={cn("group/carousel relative", className)}>
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-1 px-1 pb-1"
      >
        {React.Children.map(children, (child) => (
          <div className={cn("shrink-0 snap-start", itemClassName)}>{child}</div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Anterior"
        onClick={() => scrollBy(-1)}
        className={cn(
          "absolute top-1/2 -left-3 hidden -translate-y-1/2 rounded-full bg-background opacity-0 shadow-md transition-opacity group-hover/carousel:opacity-100 lg:flex",
          !canPrev && "pointer-events-none !opacity-0",
        )}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Siguiente"
        onClick={() => scrollBy(1)}
        className={cn(
          "absolute top-1/2 -right-3 hidden -translate-y-1/2 rounded-full bg-background opacity-0 shadow-md transition-opacity group-hover/carousel:opacity-100 lg:flex",
          !canNext && "pointer-events-none !opacity-0",
        )}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  );
}
