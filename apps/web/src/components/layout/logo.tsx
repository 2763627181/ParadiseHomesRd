import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string | null;
  /** oculta el sufijo RD (para espacios muy reducidos) */
  compact?: boolean;
}

/**
 * Wordmark de Paradise Homes RD. Sin iconografía inmobiliaria: solo tipografía.
 * "Paradise" en peso medio, "Homes" en peso regular, "RD" como superíndice sutil.
 */
export function Logo({ className, href = "/", compact = false }: LogoProps) {
  const mark = (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span>Paradise</span>
      <span className="ml-1.5 font-normal text-muted-foreground">Homes</span>
      {!compact && (
        <span className="ml-1 translate-y-[-0.35em] text-[0.62em] font-semibold tracking-[0.12em] text-accent">
          RD
        </span>
      )}
    </span>
  );

  if (href === null) return mark;

  return (
    <Link href={href} aria-label="Paradise Homes RD — inicio" className="inline-flex">
      {mark}
    </Link>
  );
}
