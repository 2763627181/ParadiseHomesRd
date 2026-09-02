"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  BEDROOM_OPTIONS,
  BATHROOM_OPTIONS,
  PARKING_OPTIONS,
  PRICE_PRESETS,
  PRIMARY_FILTER_AMENITIES,
  PROPERTY_TYPES,
  CONDITION_LABELS,
  CONDITION_STATUS,
  OPERATION_TYPE,
  type OperationType,
} from "@paradise/config";
import { formatPrice } from "@paradise/utils/currency";

import { cn } from "@/lib/utils";
import { parseSearchParams, serializeSearchParams } from "@/lib/search-params";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationCombobox } from "@/components/search/location-combobox";

interface PropertyFiltersProps {
  /** cierra el contenedor (sheet) tras aplicar */
  onApplied?: () => void;
  className?: string;
}

const CONDITIONS = [
  CONDITION_STATUS.NEW,
  CONDITION_STATUS.USED,
  CONDITION_STATUS.OFF_PLAN,
  CONDITION_STATUS.UNDER_CONSTRUCTION,
  CONDITION_STATUS.READY_TO_MOVE,
] as const;

export function PropertyFilters({ onApplied, className }: PropertyFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = React.useMemo(
    () => parseSearchParams(Object.fromEntries(searchParams.entries())),
    [searchParams],
  );

  const [draft, setDraft] = React.useState(current);
  React.useEffect(() => setDraft(current), [current]);

  const operation: OperationType = draft.operationType ?? OPERATION_TYPE.SALE;
  const currency = draft.currency ?? "USD";
  const priceOptions = PRICE_PRESETS[operation][currency];

  const patch = (next: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...next }));

  const toggleInArray = (key: "propertyTypes" | "amenities" | "conditionStatus", value: string) => {
    const list = draft[key] as string[];
    patch({
      [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    } as Partial<typeof draft>);
  };

  const apply = () => {
    const query = serializeSearchParams({
      q: draft.q,
      operationType: draft.operationType,
      propertyTypes: draft.propertyTypes as never,
      locations: draft.locations,
      minPrice: draft.minPrice,
      maxPrice: draft.maxPrice,
      currency: draft.currency,
      minBedrooms: draft.minBedrooms,
      minBathrooms: draft.minBathrooms,
      minParking: draft.minParking,
      minAreaM2: draft.minAreaM2,
      maxAreaM2: draft.maxAreaM2,
      amenities: draft.amenities,
      conditionStatus: draft.conditionStatus as never,
      verifiedOnly: draft.verifiedOnly,
      withProjectOnly: draft.withProjectOnly,
      sort: draft.sort,
    });
    router.replace(`${pathname}${query}`, { scroll: false });
    onApplied?.();
  };

  const reset = () => {
    router.replace(pathname, { scroll: false });
    onApplied?.();
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-4">
        {/* Operación */}
        <Group label="Operación">
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            {[OPERATION_TYPE.SALE, OPERATION_TYPE.RENT].map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => patch({ operationType: op, minPrice: undefined, maxPrice: undefined })}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  operation === op
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground",
                )}
              >
                {op === OPERATION_TYPE.SALE ? "Comprar" : "Alquilar"}
              </button>
            ))}
          </div>
        </Group>

        {/* Ubicación */}
        <Group label="Ubicación">
          <div className="h-11 rounded-lg border border-input bg-background">
            <LocationCombobox
              value={draft.locations}
              onChange={(locations) => patch({ locations })}
              multiple
            />
          </div>
        </Group>

        {/* Tipo */}
        <Group label="Tipo de propiedad">
          <div className="grid grid-cols-2 gap-1.5">
            {PROPERTY_TYPES.map((type) => {
              const active = draft.propertyTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => toggleInArray("propertyTypes", type.value)}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </Group>

        {/* Precio */}
        <Group label="Precio">
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={draft.minPrice ? String(draft.minPrice) : ""}
              onValueChange={(v) => patch({ minPrice: v ? Number(v) : undefined })}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Mínimo" />
              </SelectTrigger>
              <SelectContent>
                {priceOptions.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {formatPrice(p, currency, { compact: true })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={draft.maxPrice ? String(draft.maxPrice) : ""}
              onValueChange={(v) => patch({ maxPrice: v ? Number(v) : undefined })}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Máximo" />
              </SelectTrigger>
              <SelectContent>
                {priceOptions.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {formatPrice(p, currency, { compact: true })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-2 flex gap-1 rounded-lg bg-secondary p-1 text-sm">
            {(["USD", "DOP"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ currency: c, minPrice: undefined, maxPrice: undefined })}
                className={cn(
                  "flex-1 rounded-md px-2 py-1 font-medium transition-colors",
                  currency === c ? "bg-background shadow-xs" : "text-muted-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Group>

        {/* Habitaciones / baños / parqueos */}
        <Group label="Habitaciones">
          <Pills
            options={BEDROOM_OPTIONS}
            value={draft.minBedrooms}
            onChange={(v) => patch({ minBedrooms: v })}
          />
        </Group>
        <Group label="Baños">
          <Pills
            options={BATHROOM_OPTIONS}
            value={draft.minBathrooms}
            onChange={(v) => patch({ minBathrooms: v })}
          />
        </Group>
        <Group label="Parqueos">
          <Pills
            options={PARKING_OPTIONS}
            value={draft.minParking}
            onChange={(v) => patch({ minParking: v })}
          />
        </Group>

        {/* Estado */}
        <Group label="Estado">
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((c) => {
              const active = draft.conditionStatus.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleInArray("conditionStatus", c)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  {CONDITION_LABELS[c]}
                </button>
              );
            })}
          </div>
        </Group>

        {/* Características */}
        <Group label="Características">
          <div className="grid grid-cols-1 gap-2">
            {PRIMARY_FILTER_AMENITIES.map((amenity) => (
              <label key={amenity.key} className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={draft.amenities.includes(amenity.key)}
                  onCheckedChange={() => toggleInArray("amenities", amenity.key)}
                />
                {amenity.label}
              </label>
            ))}
          </div>
        </Group>

        <Separator />
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={Boolean(draft.verifiedOnly)}
              onCheckedChange={(v) => patch({ verifiedOnly: Boolean(v) })}
            />
            Solo propiedades Paradise Verified
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <Checkbox
              checked={Boolean(draft.withProjectOnly)}
              onCheckedChange={(v) => patch({ withProjectOnly: Boolean(v) })}
            />
            Solo obra nueva (proyectos)
          </label>
        </div>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t bg-background px-1 pt-3">
        <Button variant="ghost" onClick={reset} className="flex-1">
          Limpiar
        </Button>
        <Button onClick={apply} className="flex-1">
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: readonly { value: number; label: string }[];
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active ? undefined : opt.value)}
            className={cn(
              "min-w-[2.75rem] rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "border-primary bg-primary/5"
                : "border-border text-muted-foreground hover:border-foreground/30",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
