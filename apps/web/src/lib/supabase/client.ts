"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured } from "@/lib/env";

let browserClient: SupabaseClient | null = null;

/** Cliente de Supabase para el navegador. `null` si no hay backend configurado (modo demo). */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  browserClient ??= createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);
  return browserClient;
}
