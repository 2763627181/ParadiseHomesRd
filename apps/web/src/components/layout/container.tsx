import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

interface ContainerProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
  /** ancho máximo del contenido */
  size?: "default" | "wide" | "narrow" | "prose";
}

const SIZES: Record<NonNullable<ContainerProps["size"]>, string> = {
  default: "max-w-[82rem]",
  wide: "max-w-[92rem]",
  narrow: "max-w-3xl",
  prose: "max-w-[46rem]",
};

export function Container({
  className,
  asChild = false,
  size = "default",
  ...props
}: ContainerProps) {
  const Comp = asChild ? Slot : "div";
  return <Comp className={cn("mx-auto w-full container-px", SIZES[size], className)} {...props} />;
}
