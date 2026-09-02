import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  description,
  action,
  className,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-2 sm:mb-8",
        align === "center" && "items-center text-center",
        action && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.7rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-[0.95rem] text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {action.label}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
