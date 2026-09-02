"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDownIcon, LayoutGridIcon, MapIcon, SlidersHorizontalIcon } from "lucide-react";
import { SORT_OPTIONS } from "@paradise/config";

import { cn } from "@/lib/utils";
import { countActiveFilters, parseSearchParams } from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { PropertyFilters } from "@/components/property/property-filters";

export function ResultsToolbar({
  total,
  view = "list",
}: {
  total: number;
  view?: "list" | "map" | "split";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const params = parseSearchParams(Object.fromEntries(searchParams.entries()));
  const activeFilters = countActiveFilters(params);

  const setParam = (key: string, value: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{total.toLocaleString("es-DO")}</span>{" "}
        {total === 1 ? "propiedad" : "propiedades"}
      </p>

      <div className="flex items-center gap-2">
        {/* Filtros (mobile / tablet) */}
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontalIcon className="size-4" />
              Filtros
              {activeFilters > 0 && (
                <Badge variant="default" className="ml-1 size-5 rounded-full p-0">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[90%] gap-0 sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden px-4">
              <PropertyFilters onApplied={() => setFiltersOpen(false)} className="h-full" />
            </div>
          </SheetContent>
        </Sheet>

        {/* Vista */}
        <div className="hidden items-center gap-0.5 rounded-lg border border-border p-0.5 sm:flex">
          <button
            type="button"
            aria-label="Vista de lista"
            onClick={() => setParam("view", null)}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <LayoutGridIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Vista de mapa"
            onClick={() => setParam("view", "map")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "map" ? "bg-secondary text-foreground" : "text-muted-foreground",
            )}
          >
            <MapIcon className="size-4" />
          </button>
        </div>

        {/* Orden */}
        <Select
          value={params.sort}
          onValueChange={(v) => setParam("sort", v === "relevance" ? null : v)}
        >
          <SelectTrigger size="sm" className="h-9 gap-1.5">
            <ArrowUpDownIcon className="size-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
