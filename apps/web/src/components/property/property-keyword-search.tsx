"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Buscador por texto libre (la "lupita"). Sincroniza el parámetro `q` de la URL:
 * el backend lo pasa a `search_vector` (título, descripción, ubicación, código).
 * Debounce de 400 ms mientras se escribe; Enter aplica al instante.
 */
export function PropertyKeywordSearch({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get("q") ?? "";

  const [value, setValue] = React.useState(urlQ);
  React.useEffect(() => setValue(urlQ), [urlQ]);

  const commit = React.useCallback(
    (next: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      const trimmed = next.trim();
      if (trimmed) sp.set("q", trimmed);
      else sp.delete("q");
      sp.delete("cursor");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounce mientras se escribe.
  React.useEffect(() => {
    if (value === urlQ) return;
    const t = setTimeout(() => commit(value), 400);
    return () => clearTimeout(t);
  }, [value, urlQ, commit]);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        commit(value);
      }}
      className={cn(
        "flex h-12 items-center gap-2.5 rounded-xl border border-input bg-card px-3.5 shadow-xs focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
        className,
      )}
    >
      <SearchIcon className="size-[1.15rem] shrink-0 text-muted-foreground" />
      <input
        type="search"
        inputMode="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Busca por zona, título o código (ej. PH-VIL-00006)"
        aria-label="Buscar propiedades"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            commit("");
          }}
          aria-label="Limpiar búsqueda"
          className="shrink-0 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </form>
  );
}
