"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

export function AnalyticsRange({ active }: { active: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const href = (days: number) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("range", String(days));
    return `${pathname}?${sp.toString()}`;
  };

  return (
    <div className="inline-flex gap-1 rounded-lg bg-secondary p-1">
      {RANGES.map((r) => (
        <Link
          key={r.days}
          href={href(r.days)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            active === r.days ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
