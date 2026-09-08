"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import {
  BEDROOM_OPTIONS,
  OPERATION_TYPE,
  PRICE_PRESETS,
  ROUTES,
  type OperationType,
} from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";

import { analytics } from "@/lib/analytics";
import { serializeSearchParams } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationCombobox } from "@/components/search/location-combobox";

type Mode = OperationType | "PROJECTS";

const TABS: { value: Mode; label: string }[] = [
  { value: OPERATION_TYPE.SALE, label: "Comprar" },
  { value: OPERATION_TYPE.RENT, label: "Alquilar" },
  { value: "PROJECTS", label: "Proyectos" },
];

export function HeroSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>(OPERATION_TYPE.SALE);
  const [locations, setLocations] = React.useState<string[]>([]);
  const [maxPrice, setMaxPrice] = React.useState<string>("");
  const [minBedrooms, setMinBedrooms] = React.useState<string>("");

  const operation: OperationType =
    mode === "PROJECTS" ? OPERATION_TYPE.SALE : (mode as OperationType);
  const priceOptions = PRICE_PRESETS[operation].USD;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.track("search", {
      props: { mode, locations, maxPrice, minBedrooms, surface: "hero" },
    });

    if (mode === "PROJECTS") {
      const qs = locations.length ? `?locations=${locations.join(",")}` : "";
      router.push(`${ROUTES.projects()}${qs}`);
      return;
    }

    const query = serializeSearchParams({
      operationType: operation,
      locations,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      currency: "USD",
      minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
    });
    router.push(`${ROUTES.properties()}${query}`);
  };

  return (
    <form
      onSubmit={submit}
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-card/95 p-3 shadow-float backdrop-blur",
        className,
      )}
    >
      <div className="mb-3 flex gap-1 rounded-lg bg-secondary p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setMode(tab.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              mode === tab.value
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 md:grid-cols-[1.6fr_1fr_1fr_auto]">
        <div className="h-12 rounded-lg border border-input bg-background">
          <LocationCombobox value={locations} onChange={setLocations} multiple />
        </div>

        {mode !== "PROJECTS" ? (
          <>
            <Select value={maxPrice} onValueChange={setMaxPrice}>
              <SelectTrigger className="h-12 w-full" aria-label="Precio máximo">
                <SelectValue placeholder="Precio máx." />
              </SelectTrigger>
              <SelectContent>
                {priceOptions.map((price) => (
                  <SelectItem key={price} value={String(price)}>
                    Hasta {formatPrice(price, "USD", { compact: true })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={minBedrooms} onValueChange={setMinBedrooms}>
              <SelectTrigger className="h-12 w-full" aria-label="Habitaciones">
                <SelectValue placeholder="Habitaciones" />
              </SelectTrigger>
              <SelectContent>
                {BEDROOM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label} {opt.value > 0 ? "hab." : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <div className="hidden md:col-span-2 md:block" />
        )}

        <Button type="submit" size="lg" className="h-12 md:w-auto md:px-6">
          <SearchIcon className="size-4" />
          Buscar
        </Button>
      </div>
    </form>
  );
}
