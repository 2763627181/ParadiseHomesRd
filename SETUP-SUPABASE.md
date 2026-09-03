# Conectar Paradise Homes RD a Supabase

El proyecto ya está conectado en código: `apps/web/.env.local` tiene las claves de tu
proyecto Supabase (`xzczevhutiwigvlqwlpx`). Ese archivo **no se sube a Git** (`.gitignore`).

Falta un solo paso manual: **crear las tablas y cargar los datos** en tu base de datos.
Se hace desde el navegador porque tu red bloquea el puerto 5432 de Postgres.

---

## Paso 1 — Crear el schema (una sola vez)

1. Entra a **https://supabase.com/dashboard/project/xzczevhutiwigvlqwlpx**
2. Menú lateral → **SQL Editor** → **+ New query**
3. Abre el archivo [`packages/database/schema.sql`](./packages/database/schema.sql),
   copia **todo** el contenido y pégalo en el editor.
4. Pulsa **Run** (o `Ctrl/Cmd + Enter`).

Debe terminar con `Success. No rows returned`. Crea 37 tablas, 3 vistas, ~150
índices/triggers/políticas RLS y 4 buckets de Storage.

> Si aparece un aviso `NOTICE: Sin permisos sobre storage.*`, ignóralo: el resto del
> schema se aplicó bien y los buckets se pueden crear luego desde **Storage** en el
> dashboard.

## Paso 2 — Cargar los datos demo

1. **SQL Editor** → **+ New query** otra vez.
2. Abre [`packages/database/seed.sql`](./packages/database/seed.sql), copia todo y pégalo.
3. **Run**.

Carga 30 propiedades, 4 proyectos con unidades, 6 inmobiliarias, 2 desarrolladoras y
12 agentes dominicanos (marcados `is_demo = true`). Es idempotente: puedes volver a
ejecutarlo cuando quieras.

## Paso 3 — Verificar

```bash
pnpm dev
```

Abre http://localhost:3000/properties — ahora las propiedades vienen de **tu base de
datos Supabase**, no de los datos en memoria. En el dashboard de Supabase → **Table
Editor** verás las tablas pobladas.

---

## Notas

- **La app funciona aunque no hagas esto**: si las tablas no existen todavía, cae
  automáticamente a los datos demo en memoria. No se rompe nada.
- **Auth**: el registro / inicio de sesión ya funciona contra tu Supabase (email +
  Google si lo activas en Authentication → Providers → Google).
- **Regenerar tipos TypeScript** (opcional, la app no lo necesita):
  ```bash
  npx supabase login          # una vez, abre el navegador
  pnpm db:types                # usa la Management API por HTTPS
  ```
- **Correr migraciones desde la terminal** (si algún día tienes el puerto 5432 abierto,
  p. ej. desde otra red): en el dashboard pulsa **Connect** → copia el string del
  **Session pooler**, ponlo en `SUPABASE_DB_URL` (con la contraseña URL-encoded:
  `?` → `%3F`) y corre `pnpm db:migrate && pnpm db:seed`.
- **Google Maps**: añade `NEXT_PUBLIC_GOOGLE_MAPS_KEY` en `apps/web/.env.local` para
  activar el mapa (sin la clave se muestra un fallback).

## Seguridad

- `apps/web/.env.local` contiene la `service_role` key — **nunca** la subas a Git ni la
  pongas en variables `NEXT_PUBLIC_*`. Ya está en `.gitignore`.
- Si en algún momento estas claves se filtran, rótalas en Supabase → **Settings → API**.
