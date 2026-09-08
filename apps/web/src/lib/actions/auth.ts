"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { loginSchema, registerSchema, forgotPasswordSchema } from "@paradise/validation";

import { env, isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

function zodErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

const NOT_CONFIGURED: AuthResult = {
  ok: false,
  message: "Las cuentas estarán disponibles cuando se conecte el backend.",
};

export async function loginAction(input: unknown): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: zodErrors(parsed.error) };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { ok: false, message: "Correo o contraseña incorrectos." };

  revalidatePath("/", "layout");
  redirect(parsed.data.next ?? "/dashboard");
}

export async function registerAction(input: unknown): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: zodErrors(parsed.error) };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, phone: parsed.data.phone ?? null },
      emailRedirectTo: `${env.APP_URL}/auth/callback`,
    },
  });
  if (error) {
    return {
      ok: false,
      message: error.message.includes("already")
        ? "Ya existe una cuenta con este correo."
        : "No pudimos crear la cuenta. Intenta de nuevo.",
    };
  }

  return { ok: true, message: "Revisa tu correo para confirmar la cuenta." };
}

export async function forgotPasswordAction(input: unknown): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, fieldErrors: zodErrors(parsed.error) };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.APP_URL}/auth/set-password?next=/dashboard`,
  });
  return { ok: true, message: "Si el correo existe, te enviamos un enlace para restablecer la contraseña." };
}

export async function loginWithGoogleAction(next?: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) return NOT_CONFIGURED;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return NOT_CONFIGURED;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${env.APP_URL}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}` },
  });
  if (error || !data.url) return { ok: false, message: "No pudimos iniciar sesión con Google." };
  redirect(data.url);
}

export async function logoutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  await supabase?.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
