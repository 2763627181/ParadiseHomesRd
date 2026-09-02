"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import {
  loginSchema,
  registerSchema,
  type LoginValues,
  type RegisterValues,
} from "@paradise/validation";

import { loginAction, loginWithGoogleAction, registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

function GoogleButton({ next }: { next?: string }) {
  const [pending, setPending] = React.useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void loginWithGoogleAction(next);
      }}
    >
      {pending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <svg className="size-4" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 11v2.5h5.9c-.3 1.5-1.7 4.5-5.9 4.5-3.5 0-6.4-2.9-6.4-6.5S8.5 5.5 12 5.5c2 0 3.4.9 4.2 1.6L18 5.3C16.6 4 14.6 3 12 3 6.9 3 3 6.9 3 12s3.9 9 9 9c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.3H12Z"
          />
        </svg>
      )}
      Continuar con Google
    </Button>
  );
}

export function LoginForm({ next, disabled }: { next?: string; disabled?: boolean }) {
  const [formError, setFormError] = React.useState<string | null>(null);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await loginAction(values);
    if (result?.fieldErrors) {
      for (const [k, m] of Object.entries(result.fieldErrors)) {
        form.setError(k as keyof LoginValues, { message: m });
      }
    }
    if (result && !result.ok) setFormError(result.message ?? "No pudimos iniciar sesión.");
  });

  return (
    <div className="space-y-4">
      <GoogleButton next={next} />
      <Divider />
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Correo</Label>
          <Input id="login-email" type="email" autoComplete="email" {...form.register("email")} />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Contraseña</Label>
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
          )}
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={disabled || form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Iniciar sesión
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm({ next, disabled }: { next?: string; disabled?: boolean }) {
  const [formError, setFormError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: true,
      next,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    const result = await registerAction(values);
    if (result.ok) {
      setDone(result.message ?? "Cuenta creada.");
      return;
    }
    if (result.fieldErrors) {
      for (const [k, m] of Object.entries(result.fieldErrors)) {
        form.setError(k as keyof RegisterValues, { message: m });
      }
    }
    setFormError(result.message ?? "No pudimos crear la cuenta.");
  });

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <CheckCircle2Icon className="size-9 text-verified" />
        <p className="font-medium">Ya casi</p>
        <p className="max-w-xs text-sm text-muted-foreground">{done}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GoogleButton next={next} />
      <Divider />
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Nombre completo</Label>
          <Input id="reg-name" autoComplete="name" {...form.register("fullName")} />
          {form.formState.errors.fullName && (
            <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Correo</Label>
            <Input id="reg-email" type="email" autoComplete="email" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-phone">Teléfono (opcional)</Label>
            <Input id="reg-phone" inputMode="tel" {...form.register("phone")} />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-pw">Contraseña</Label>
            <Input id="reg-pw" type="password" autoComplete="new-password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-pw2">Repetir contraseña</Label>
            <Input
              id="reg-pw2"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
        <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <Checkbox
            className="mt-0.5"
            checked={form.watch("acceptTerms")}
            onCheckedChange={(v) => form.setValue("acceptTerms", v === true, { shouldValidate: true })}
          />
          <span>
            Acepto los{" "}
            <Link href="/terms" className="underline underline-offset-2">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              política de privacidad
            </Link>
            .
          </span>
        </label>
        {form.formState.errors.acceptTerms && (
          <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
        )}
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" className="w-full" disabled={disabled || form.formState.isSubmitting}>
          {form.formState.isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
          Crear cuenta
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-card px-2 text-muted-foreground">o con tu correo</span>
      </div>
    </div>
  );
}
