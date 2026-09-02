/**
 * Aplica las migraciones SQL de `migrations/` a la base de datos apuntada por
 * SUPABASE_DB_URL. Registra las aplicadas en `_paradise_migrations`.
 *
 *   pnpm db:migrate            aplica las pendientes
 *   pnpm db:migrate --reset    recrea el schema public y aplica todas
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import { getDbUrl, loadEnv } from "./_env.js";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, "../migrations");
const RESET = process.argv.includes("--reset");

async function main() {
  const sql = postgres(getDbUrl(), { max: 1, onnotice: () => {} });

  try {
    if (RESET) {
      console.log("⚠  --reset: recreando schema public…");
      await sql.unsafe(`
        drop schema if exists public cascade;
        create schema public;
        grant usage on schema public to anon, authenticated, service_role;
        grant all on schema public to postgres, service_role;
        alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
        alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
      `);
    }

    await sql.unsafe(`
      create table if not exists _paradise_migrations (
        name        text primary key,
        checksum    text not null,
        applied_at  timestamptz not null default now()
      );
    `);

    const applied = new Map<string, string>(
      (await sql<{ name: string; checksum: string }[]>`select name, checksum from _paradise_migrations`).map(
        (r) => [r.name, r.checksum],
      ),
    );

    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let count = 0;
    for (const file of files) {
      const body = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      const checksum = createHash("sha256").update(body).digest("hex").slice(0, 16);

      if (applied.has(file)) {
        if (applied.get(file) !== checksum) {
          console.warn(`⚠  ${file} cambió desde que se aplicó (checksum distinto). No se re-ejecuta.`);
        }
        continue;
      }

      process.stdout.write(`→ ${file} … `);
      await sql.begin(async (tx) => {
        await tx.unsafe(body);
        await tx`insert into _paradise_migrations (name, checksum) values (${file}, ${checksum})`;
      });
      console.log("ok");
      count++;
    }

    console.log(count === 0 ? "\n✓ Sin migraciones pendientes." : `\n✓ ${count} migración(es) aplicada(s).`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error("\n✗ Error aplicando migraciones:\n", error);
  process.exit(1);
});
