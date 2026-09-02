/**
 * Acceso central y tipado a variables de entorno.
 * Las `NEXT_PUBLIC_*` se inlinean en build; el resto solo existe en server.
 */

function optional(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  APP_URL: optional("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000",
  APP_NAME: optional("NEXT_PUBLIC_APP_NAME") ?? "Paradise Homes RD",

  ADMIN_WHATSAPP: optional("NEXT_PUBLIC_ADMIN_WHATSAPP") ?? "18498620269",
  ADMIN_CONTACT_NAME: optional("NEXT_PUBLIC_ADMIN_CONTACT_NAME") ?? "Joseph Steven Julián Ortiz",

  SUPABASE_URL: optional("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: optional("NEXT_PUBLIC_SUPABASE_ANON_KEY"),

  GOOGLE_MAPS_KEY: optional("NEXT_PUBLIC_GOOGLE_MAPS_KEY"),
  GOOGLE_MAPS_MAP_ID: optional("NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID"),

  GA_ID: optional("NEXT_PUBLIC_GA_ID"),
  META_PIXEL_ID: optional("NEXT_PUBLIC_META_PIXEL_ID"),
  TIKTOK_PIXEL_ID: optional("NEXT_PUBLIC_TIKTOK_PIXEL_ID"),
  POSTHOG_KEY: optional("NEXT_PUBLIC_POSTHOG_KEY"),
  POSTHOG_HOST: optional("NEXT_PUBLIC_POSTHOG_HOST") ?? "https://us.i.posthog.com",

  SENTRY_DSN: optional("NEXT_PUBLIC_SENTRY_DSN"),

  FLAGS: {
    paradiseAi: optional("NEXT_PUBLIC_ENABLE_PARADISE_AI") === "true",
    mortgageCalculator: optional("NEXT_PUBLIC_ENABLE_MORTGAGE_CALCULATOR") !== "false",
    compare: optional("NEXT_PUBLIC_ENABLE_COMPARE") !== "false",
  },
} as const;

/** Solo server. Lanza si se accede sin configurar. */
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    return optional("SUPABASE_SERVICE_ROLE_KEY");
  },
  get RESEND_API_KEY(): string | undefined {
    return optional("RESEND_API_KEY");
  },
  get RESEND_FROM_EMAIL(): string {
    return optional("RESEND_FROM_EMAIL") ?? "Paradise Homes RD <no-reply@paradisehomesrd.com>";
  },
};

/** ¿Hay backend Supabase configurado? Si no, la web corre en modo demo. */
export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);

/** ¿Hay Google Maps disponible? Si no, se muestra fallback. */
export const isMapsConfigured = Boolean(env.GOOGLE_MAPS_KEY);
