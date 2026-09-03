/**
 * Concatena `migrations/*.sql` en un único `schema.sql` para el SQL Editor de Supabase.
 *   pnpm --filter @paradise/database sql:schema
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(dirname(fileURLToPath(import.meta.url)), "../migrations");
const out = resolve(dir, "../schema.sql");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

let sql =
  "-- ═══════════════════════════════════════════════════════════════════════════\n" +
  "-- Paradise Homes RD — Schema completo (generado desde migrations/*.sql)\n" +
  "--\n" +
  "-- USO: Supabase Dashboard → SQL Editor → New query → pega TODO esto → Run.\n" +
  "-- Ejecútalo una sola vez sobre una base limpia. Luego ejecuta seed.sql.\n" +
  "-- ═══════════════════════════════════════════════════════════════════════════\n";

for (const f of files) {
  sql += `\n\n-- ═══ ${f} ═══════════════════════════════════════════════\n\n`;
  sql += readFileSync(resolve(dir, f), "utf8").trim() + "\n";
}

writeFileSync(out, sql, "utf8");
console.log(`✓ ${out} (${files.length} migraciones, ${sql.length} bytes)`);
