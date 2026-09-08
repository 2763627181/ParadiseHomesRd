"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2Icon, StarIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDateRd } from "@paradise/utils/datetime";

import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { submitAgentReview } from "@/lib/actions/reviews";
import type { AgentReview } from "@/lib/data/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex", className)} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={cn("size-4", n <= value ? "fill-accent text-accent" : "text-border")} />
      ))}
    </span>
  );
}

export function AgentReviews({
  agentId,
  agentSlug,
  reviews,
  average,
  count,
}: {
  agentId: string;
  agentSlug: string;
  reviews: AgentReview[];
  average: number | null;
  count: number;
}) {
  const router = useRouter();
  const [session, setSession] = React.useState<"loading" | "in" | "out">("loading");
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setSession("out");
    void supabase.auth.getUser().then(({ data }) => setSession(data.user ? "in" : "out"));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) return toast.error("Elige una calificación.");
    setPending(true);
    const res = await submitAgentReview({ agentId, rating, title: title || undefined, body });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Reseña enviada");
      setOpen(false);
      setTitle("");
      setBody("");
      setRating(0);
      router.refresh();
    } else {
      toast.error(res.message ?? "No se pudo enviar la reseña");
    }
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Reseñas{count > 0 && <span className="text-muted-foreground"> ({count})</span>}
        </h2>
        {average != null && (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Stars value={Math.round(average)} />
            <span className="font-medium">{average.toFixed(1)}</span>
          </span>
        )}
      </div>

      {session === "in" && !open && (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="mb-4">
          Escribir una reseña
        </Button>
      )}
      {session === "out" && (
        <p className="mb-4 text-sm text-muted-foreground">
          <Link href={`/login?next=/agent/${agentSlug}`} className="font-medium text-primary hover:underline">
            Inicia sesión
          </Link>{" "}
          para dejar una reseña.
        </p>
      )}

      {open && (
        <form onSubmit={submit} className="mb-6 space-y-3 rounded-xl border border-border/70 bg-card p-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} estrellas`}
                className="p-0.5"
              >
                <StarIcon
                  className={cn(
                    "size-6 transition-colors",
                    n <= (hover || rating) ? "fill-accent text-accent" : "text-border",
                  )}
                />
              </button>
            ))}
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (opcional)"
            maxLength={120}
            disabled={pending}
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="¿Cómo fue trabajar con este asesor?"
            rows={4}
            maxLength={2000}
            required
            disabled={pending}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending && <Loader2Icon className="size-4 animate-spin" />}
              Publicar reseña
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Si ya reseñaste a este asesor, esto reemplazará tu reseña anterior.
          </p>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este asesor aún no tiene reseñas.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{r.authorName}</p>
                  <p className="text-xs text-muted-foreground">{formatDateRd(r.createdAt)}</p>
                </div>
                <Stars value={r.rating} />
              </div>
              {r.title && <p className="mt-2 text-sm font-medium">{r.title}</p>}
              <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
