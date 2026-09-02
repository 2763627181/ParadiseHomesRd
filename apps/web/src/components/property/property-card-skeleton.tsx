import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PropertyCardSkeleton({
  variant = "standard",
  className,
}: {
  variant?: "standard" | "horizontal" | "compact" | "featured";
  className?: string;
}) {
  const horizontal = variant === "horizontal";
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/70 bg-card",
        horizontal ? "flex" : "flex flex-col",
        className,
      )}
    >
      <Skeleton
        className={cn(
          "shrink-0 rounded-none",
          horizontal ? "aspect-square w-44" : variant === "featured" ? "aspect-[16/11]" : "aspect-[4/3]",
        )}
      />
      <div className={cn("flex flex-1 flex-col gap-2.5", horizontal ? "p-3.5" : "p-4")}>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="mt-1 h-3.5 w-2/3" />
      </div>
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  );
}
