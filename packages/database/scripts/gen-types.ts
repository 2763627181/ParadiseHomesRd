/**
 * Regenera `src/database.types.ts` desde el proyecto Supabase.
 * Requiere la CLI de Supabase (`npm i -g supabase`) y una de:
 *   · SUPABASE_PROJECT_ID   (proyecto remoto)
 *   · SUPABASE_DB_URL        (base local o remota)
 *
 *   pnpm db:types
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { loadEnv } from "./_env";

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/database.types.ts");

const projectId = process.env.SUPABASE_PROJECT_ID;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!projectId && !dbUrl) {
  console.error("✗ Define SUPABASE_PROJECT_ID o SUPABASE_DB_URL para generar tipos.");
  process.exit(1);
}

const args = ["gen", "types", "typescript", "--schema", "public"];
if (projectId) args.push("--project-id", projectId);
else args.push("--db-url", dbUrl!);

try {
  console.log(`→ supabase ${args.join(" ")}`);
  const output = execFileSync("supabase", args, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  const banner =
    "/* Generado por `pnpm db:types` (supabase gen types). No editar a mano. */\n\n";
  writeFileSync(OUT, banner + output, "utf8");
  console.log(`✓ ${OUT}`);
} catch (error) {
  console.error("✗ No se pudieron generar los tipos. ¿Está instalada la CLI de Supabase?");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
