"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Pantalla para definir la contraseña. La usan:
 * - el enlace de "restablecer contraseña" (/forgot-password)
 * - los correos de invitación (aprobación de socios, invitar asesor)
 * El enlace de Supabase inicia sesión automáticamente; aquí solo se fija
 * la nueva contraseña con `updateUser`.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [state, setState] = React.useState<"checking" | "ready" | "no-session">("checking");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setState("no-session");
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setState(data.session ? "ready" : "no-session");
    };

    // El token de recuperación/invitación llega en el hash y dispara este evento.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        setState("ready");
      }
    });
    void check();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return setError("Servicio no disponible.");

    setPending(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace(next.startsWith("/") ? next : "/dashboard"), 1500);
  };

  return (
    <Container size="narrow" className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo href="/" className="text-lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Define tu contraseña</h1>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6">
          {state === "checking" && (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" /> Verificando el enlace…
            </p>
          )}

          {state === "no-session" && (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Este enlace no es válido o ya expiró. Pide uno nuevo desde{" "}
                <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            </div>
          )}

          {state === "ready" && done && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2Icon className="size-9 text-verified" />
              <p className="font-medium">Contraseña actualizada</p>
              <p className="text-sm text-muted-foreground">Te estamos redirigiendo…</p>
            </div>
          )}

          {state === "ready" && !done && (
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sp-pw">Nueva contraseña</Label>
                <Input
                  id="sp-pw"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sp-pw2">Repetir contraseña</Label>
                <Input
                  id="sp-pw2"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={pending}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2Icon className="size-4 animate-spin" />}
                Guardar contraseña
              </Button>
            </form>
          )}
        </div>
      </div>
    </Container>
  );
}
