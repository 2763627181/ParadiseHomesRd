import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

/** Carga variables desde la raíz del repo y desde apps/web/.env.local. */
export function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "../../.env"),
    resolve(process.cwd(), "../../.env.local"),
    resolve(process.cwd(), "../../apps/web/.env.local"),
    resolve(process.cwd(), "apps/web/.env.local"),
  ];
  for (const path of candidates) {
    if (existsSync(path)) config({ path, override: false });
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`\n✗ Falta la variable de entorno ${name}.`);
    console.error(`  Copia .env.example a apps/web/.env.local y complétala.\n`);
    process.exit(1);
  }
  return value;
}

export function getDbUrl(): string {
  return requireEnv("SUPABASE_DB_URL");
}

/** Cliente `postgres` configurado para Supabase (SSL, pooler-aware). */
export function createSql() {
  const url = getDbUrl();
  const isLocal = /localhost|127\.0\.0\.1|::1/.test(url);
  const isPooler = url.includes("pooler.supabase.com");
  return postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    onnotice: () => {},
    ssl: isLocal ? false : "require",
    // El transaction pooler no soporta prepared statements.
    prepare: !isPooler,
  });
}
