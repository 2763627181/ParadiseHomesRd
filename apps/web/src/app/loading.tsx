import { Container } from "@/components/layout/container";
import { PropertyGridSkeleton } from "@/components/property/property-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Container className="py-10">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="mt-3 h-5 w-96" />
      <div className="mt-10">
        <PropertyGridSkeleton count={6} />
      </div>
    </Container>
  );
}
