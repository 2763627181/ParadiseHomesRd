"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import type { PropertySummary } from "@paradise/types";

import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyCardSkeleton } from "@/components/property/property-card-skeleton";

interface Page {
  items: PropertySummary[];
  total: number;
  nextCursor: string | null;
}

interface PropertyResultsProps {
  initialPage: Page;
  layout?: "grid" | "list";
}

export function PropertyResults({ initialPage, layout = "grid" }: PropertyResultsProps) {
  const searchParams = useSearchParams();
  const key = searchParams.toString();

  const query = useInfiniteQuery({
    queryKey: ["properties", key],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }): Promise<Page> => {
      const sp = new URLSearchParams(key);
      if (pageParam) sp.set("cursor", pageParam);
      const res = await fetch(`/api/properties?${sp.toString()}`);
      if (!res.ok) throw new Error("No se pudieron cargar las propiedades");
      return res.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: { pages: [initialPage], pageParams: [null] },
  });

  const items = query.data?.pages.flatMap((p) => p.items) ?? initialPage.items;
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [query]);

  return (
    <div>
      <div
        className={
          layout === "grid"
            ? "grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-4"
        }
      >
        {items.map((property, i) => (
          <PropertyCard
            key={property.id}
            property={property}
            variant={layout === "list" ? "horizontal" : "standard"}
            priority={i < 4}
          />
        ))}
        {query.isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, i) => (
            <PropertyCardSkeleton key={`sk-${i}`} variant={layout === "list" ? "horizontal" : "standard"} />
          ))}
      </div>

      <div ref={sentinelRef} className="h-4" />

      {query.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage && <Loader2Icon className="size-4 animate-spin" />}
            Cargar más propiedades
          </Button>
        </div>
      )}
    </div>
  );
}
