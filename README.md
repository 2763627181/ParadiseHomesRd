<div align="center">

# Paradise Homes RD

**Tu próximo hogar comienza aquí.**

Marketplace inmobiliario premium para República Dominicana — descubre propiedades verificadas para
comprar, alquilar o invertir, y conecta con inmobiliarias, desarrolladores y asesores.

</div>

---

## ¿Qué es?

Paradise Homes RD conecta compradores e interesados con inmobiliarias, desarrolladores,
constructoras, brokers, agentes y propietarios autorizados. En su primera versión **no procesa el
pago del inmueble**: el cierre ocurre directamente entre las partes. La plataforma se enfoca en
**descubrimiento de propiedades, generación y seguimiento de leads, y medición del negocio**.

## Arquitectura

Ver [`ARCHITECTURE.md`](./ARCHITECTURE.md) para el detalle completo (roles, modelo de datos, rutas,
componentes, design system y fases).

```text
apps/
  web/         Next.js 16 (App Router, RSC) — producto principal
  mobile/      Expo / React Native (fase 3)
packages/
  config/      Constantes de negocio (ubicaciones RD, tipos, amenidades, enums, rutas)
  types/       Tipos de dominio
  validation/  Esquemas Zod compartidos
  utils/       Utilidades puras (moneda, fechas, slug, códigos, analytics core)
  database/    Migraciones SQL, seed, tipos generados de Supabase
  ui/          Primitivos visuales compartibles (fase 3)
```

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Radix UI · Framer Motion ·
lucide-react · React Hook Form · Zod · TanStack Query · Zustand · Sonner · Supabase (Postgres, Auth,
Storage, RLS) · Google Maps · Turborepo · pnpm.

Deploy: Vercel (web) · Supabase (DB) · Cloudflare R2 (multimedia a escala) · Resend (email) ·
Expo EAS (mobile).

## Requisitos

- Node.js `>= 20.11`
- pnpm `>= 9` (`npm i -g pnpm`)
- Una cuenta de [Supabase](https://supabase.com) y su CLI (`npm i -g supabase`) para migraciones locales

## Setup

```bash
# 1. Instalar dependencias (desde la raíz del monorepo)
pnpm install

# 2. Variables de entorno
cp .env.example apps/web/.env.local
#   Completa NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#   SUPABASE_DB_URL y NEXT_PUBLIC_GOOGLE_MAPS_KEY.

# 3. Base de datos: aplicar migraciones y seed
pnpm db:migrate          # aplica packages/database/migrations/*.sql a SUPABASE_DB_URL
pnpm db:seed             # carga datos demo dominicanos (marcados como demo)
pnpm db:types            # regenera packages/database/src/database.types.ts

# 4. Desarrollo
pnpm dev                 # web en http://localhost:3000
```

> Sin `NEXT_PUBLIC_GOOGLE_MAPS_KEY` la app funciona: el mapa muestra un fallback elegante.
> Sin Supabase configurado, la app arranca en modo demo con datos del seed local.

## Scripts

| Script | Descripción |
| --- | --- |
| `pnpm dev` | Levanta todas las apps en modo desarrollo |
| `pnpm build` | Build de producción (Turborepo) |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint en todo el monorepo |
| `pnpm typecheck` | `tsc --noEmit` en todos los paquetes |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm test:e2e` | End-to-end (Playwright) |
| `pnpm format` | Prettier |
| `pnpm db:migrate` | Aplica migraciones SQL |
| `pnpm db:seed` | Carga datos demo |
| `pnpm db:reset` | Recrea el schema desde cero + seed |
| `pnpm db:types` | Regenera tipos de Supabase |

## Migraciones

Las migraciones viven en [`packages/database/migrations`](./packages/database/migrations) como
archivos `NNNN_nombre.sql` versionados. Nunca se edita una migración ya aplicada: se crea una nueva.

## Deployment

- **Web:** conectar el repo a Vercel, root `apps/web`, y cargar las variables de entorno.
- **DB:** proyecto de Supabase; aplicar `packages/database/migrations` vía `supabase db push` o
  `pnpm db:migrate` en CI.
- **Multimedia:** bucket `property-media` en Supabase Storage (fase 1) o Cloudflare R2 (escala).

## Datos demo

El seed genera propiedades, proyectos, agencias y agentes **ficticios pero realistas** de República
Dominicana, marcados con `is_demo = true`. No usar en producción.

## Contacto

Paradise Homes RD — Joseph Steven Julián Ortiz · WhatsApp +1 849-862-0269

## Licencia

Propietario. © Paradise Homes RD.
