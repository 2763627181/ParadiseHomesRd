"use client";

import * as React from "react";
import { MapPinIcon, XIcon } from "lucide-react";
import { LOCATIONS, LOCATIONS_BY_SLUG, LOCATION_TYPE } from "@paradise/config";
import { toSlug } from "@paradise/utils/slug";

import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TYPE_LABEL: Record<string, string> = {
  [LOCATION_TYPE.PROVINCE]: "Provincia",
  [LOCATION_TYPE.MUNICIPALITY]: "Municipio",
  [LOCATION_TYPE.SECTOR]: "Sector",
};

const SEARCHABLE = LOCATIONS.filter((l) => l.type !== LOCATION_TYPE.COUNTRY);

interface LocationComboboxProps {
  value: string[];
  onChange: (slugs: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export function LocationCombobox({
  value,
  onChange,
  multiple = false,
  placeholder = "¿Dónde quieres vivir?",
  className,
}: LocationComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const normalizedQuery = toSlug(query);
  const results = React.useMemo(() => {
    if (!normalizedQuery) {
      return SEARCHABLE.filter((l) => l.isFeatured).slice(0, 8);
    }
    return SEARCHABLE.filter((l) => {
      const hay = `${toSlug(l.name)} ${l.slug}`;
      return hay.includes(normalizedQuery);
    }).slice(0, 10);
  }, [normalizedQuery]);

  const selected = value
    .map((slug) => LOCATIONS_BY_SLUG[slug])
    .filter((l): l is (typeof LOCATIONS)[number] => Boolean(l));

  const pick = (slug: string) => {
    if (multiple) {
      onChange(value.includes(slug) ? value.filter((s) => s !== slug) : [...value, slug]);
    } else {
      onChange([slug]);
      setOpen(false);
    }
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-full w-full items-center gap-2.5 rounded-lg px-3.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/25",
            className,
          )}
        >
          <MapPinIcon className="size-[1.15rem] shrink-0 text-muted-foreground" />
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap items-center gap-1 truncate">
              {selected.slice(0, 2).map((loc) => (
                <span
                  key={loc.slug}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium"
                >
                  {loc.name}
                  <XIcon
                    className="size-3 opacity-60 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(value.filter((s) => s !== loc.slug));
                    }}
                  />
                </span>
              ))}
              {selected.length > 2 && (
                <span className="text-xs text-muted-foreground">+{selected.length - 2}</span>
              )}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] min-w-[18rem] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Ciudad, sector o provincia…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Sin resultados para “{query}”.</CommandEmpty>
            <CommandGroup heading={normalizedQuery ? "Resultados" : "Zonas populares"}>
              {results.map((loc) => {
                const parent = loc.parentSlug ? LOCATIONS_BY_SLUG[loc.parentSlug] : undefined;
                const active = value.includes(loc.slug);
                return (
                  <CommandItem
                    key={loc.slug}
                    value={loc.slug}
                    onSelect={() => pick(loc.slug)}
                    className={cn(active && "bg-secondary")}
                  >
                    <MapPinIcon />
                    <span className="flex-1">
                      {loc.name}
                      {parent && parent.type !== LOCATION_TYPE.COUNTRY && (
                        <span className="text-muted-foreground">, {parent.name}</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {TYPE_LABEL[loc.type] ?? ""}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
