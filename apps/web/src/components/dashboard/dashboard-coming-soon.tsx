import { HammerIcon } from "lucide-react";

export function DashboardComingSoon({
  title,
  description,
  phase = "fase 2",
}: {
  title: string;
  description?: string;
  phase?: string;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-accent-subtle text-accent-foreground">
        <HammerIcon className="size-5" />
      </span>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description ?? "Esta sección está en construcción y llegará pronto."}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Planificado para {phase}.</p>
    </div>
  );
}
