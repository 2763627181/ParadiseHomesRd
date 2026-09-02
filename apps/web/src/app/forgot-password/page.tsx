"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { forgotPasswordSchema } from "@paradise/validation";

import { forgotPasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";

type Values = { email: string };

export default function ForgotPasswordPage() {
  const [done, setDone] = React.useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await forgotPasswordAction(values);
    setDone(result.message ?? "Revisa tu correo.");
  });

  return (
    <Container size="narrow" className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Logo href="/" className="text-lg" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Restablecer contraseña</h1>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          {done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <CheckCircle2Icon className="size-8 text-verified" />
              <p className="text-sm text-muted-foreground">{done}</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="fp-email">Correo</Label>
                <Input id="fp-email" type="email" {...form.register("email")} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                Enviar enlace
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Volver a iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </Container>
  );
}
