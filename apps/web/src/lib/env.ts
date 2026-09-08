/**
 * Acceso central y tipado a variables de entorno.
 *
 * IMPORTANTE: las `NEXT_PUBLIC_*` se inlinean en build SOLO si se escriben como
 * acceso literal `process.env.NEXT_PUBLIC_XXX`. Un acceso dinámico
 * (`process.env[nombre]`) NO se reemplaza y en el navegador da `undefined`.
 * Por eso cada variable pública se lee aquí de forma literal.
 */

function clean(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  APP_URL: clean(process.env.NEXT_PUBLIC_APP_URL) ?? "http://localhost:3000",
  APP_NAME: clean(process.env.NEXT_PUBLIC_APP_NAME) ?? "Paradise Homes RD",

  ADMIN_WHATSAPP: clean(process.env.NEXT_PUBLIC_ADMIN_WHATSAPP) ?? "18498620269",
  ADMIN_CONTACT_NAME:
    clean(process.env.NEXT_PUBLIC_ADMIN_CONTACT_NAME) ?? "Joshua Steven Williams Ortiz",

  SUPABASE_URL: clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  SUPABASE_ANON_KEY: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),

  GOOGLE_MAPS_KEY: clean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY),
  GOOGLE_MAPS_MAP_ID: clean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID),

  GA_ID: clean(process.env.NEXT_PUBLIC_GA_ID),
  META_PIXEL_ID: clean(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  TIKTOK_PIXEL_ID: clean(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
  POSTHOG_KEY: clean(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  POSTHOG_HOST: clean(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://us.i.posthog.com",

  SENTRY_DSN: clean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  FLAGS: {
    paradiseAi: process.env.NEXT_PUBLIC_ENABLE_PARADISE_AI === "true",
    mortgageCalculator: process.env.NEXT_PUBLIC_ENABLE_MORTGAGE_CALCULATOR !== "false",
    compare: process.env.NEXT_PUBLIC_ENABLE_COMPARE !== "false",
  },
} as const;

/** Solo server. Lanza si se accede sin configurar. */
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY(): string | undefined {
    return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get RESEND_API_KEY(): string | undefined {
    return clean(process.env.RESEND_API_KEY);
  },
  get RESEND_FROM_EMAIL(): string {
    return clean(process.env.RESEND_FROM_EMAIL) ?? "Paradise Homes RD <no-reply@paradisehomesrd.com>";
  },
  /** Token para autenticar los cron jobs de Vercel. */
  get CRON_SECRET(): string | undefined {
    return clean(process.env.CRON_SECRET);
  },
};

/** ¿Hay backend Supabase configurado? Si no, la web corre en modo demo. */
export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);

/** ¿Hay Google Maps disponible? Si no, se muestra fallback. */
export const isMapsConfigured = Boolean(env.GOOGLE_MAPS_KEY);
