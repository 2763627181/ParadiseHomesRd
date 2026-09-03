import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, isSupabaseConfigured, serverEnv } from "@/lib/env";

let publicClient: SupabaseClient | null = null;

/** Cliente anónimo sin cookies. Seguro en cualquier contexto (build, generateStaticParams). */
function getSupabasePublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  publicClient ??= createClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return publicClient;
}

/**
 * Cliente Supabase para Server Components / Route Handlers / Server Actions.
 * Devuelve `null` en modo demo (sin backend). Si se llama fuera de un request
 * (p. ej. `generateStaticParams` en build), cae al cliente anónimo sin cookies.
 *
 * Sin genérico `Database`: los tipos se regeneran con `pnpm db:types`.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;

  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch {
    return getSupabasePublicClient();
  }

  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
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
          // Llamado desde un Server Component: el proxy refrescará la sesión.
        }
      },
    },
  });
}

/**
 * Cliente con service role — OMITE RLS. Solo para operaciones de backend
 * controladas (crear leads, escribir analítica, moderación). Nunca en el cliente.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured || !serverEnv.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(env.SUPABASE_URL!, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
