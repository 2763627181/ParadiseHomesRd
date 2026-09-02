"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@paradise/database/types";

import { env, isSupabaseConfigured } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Cliente de Supabase para el navegador. `null` si no hay backend configurado (modo demo). */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;
  browserClient ??= createBrowserClient<Database>(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);
  return browserClient;
}
