import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@paradise/database/types";

import { env, isSupabaseConfigured, serverEnv } from "@/lib/env";

/**
 * Cliente Supabase para Server Components / Route Handlers / Server Actions.
 * Devuelve `null` en modo demo (sin backend).
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Llamado desde un Server Component: el middleware refrescará la sesión.
        }
      },
    },
  });
}

/**
 * Cliente con service role — OMITE RLS. Solo para operaciones de backend
 * controladas (crear leads, escribir analítica, moderación). Nunca en el cliente.
 *
 * Sin tipar con `Database` a propósito: se usa para escrituras puntuales y los
 * tipos generados aún no existen (se regeneran con `pnpm db:types`).
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.SUPABASE_URL!, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
