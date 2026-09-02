import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

/** Carga variables desde la raíz del repo y desde apps/web/.env.local. */
export function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), "../../.env"),
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
