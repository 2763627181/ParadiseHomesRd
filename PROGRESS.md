# Paradise Homes RD — Estado de construcción

> Seguimiento del plan de 20 STEPs (ver `ARCHITECTURE.md` §13).
> Última actualización: 2026-09-02.

## 🔌 Conexión a Supabase

- **Proyecto:** `xzczevhutiwigvlqwlpx` · claves configuradas en `apps/web/.env.local` (no versionado).
- **App ↔ Supabase:** conectada por HTTPS (REST + Auth verificados). El puerto Postgres
  5432/6543 está bloqueado en la red actual, así que las migraciones se aplican desde el
  **SQL Editor del dashboard** — ver [`SETUP-SUPABASE.md`](./SETUP-SUPABASE.md).
- **Scripts listos:** `packages/database/schema.sql` (37 tablas + RLS + vistas) y
  `packages/database/seed.sql` (datos demo) — pegar y ejecutar en el SQL Editor.
- Mientras el schema no esté aplicado, la app cae automáticamente a los datos demo en
  memoria (sin romperse).

## ✅ Completado

| STEP | Entregado |
| --- | --- |
| 1. Estructura | Monorepo Turborepo + pnpm (`apps/web`, `packages/config·types·utils·validation·database`) |
| 2. Stack | Next.js 16 · React 19 · TS estricto · Tailwind v4 · shadcn/ui · Framer Motion · lucide · RHF+Zod · TanStack Query · Zustand · Sonner · ESLint 9 |
| 3. Design system | Tokens Paradise (verde bosque + champagne), light/dark/system, Geist, sombras suaves, `globals.css` con `@theme` |
| 4. DB schema | 8 migraciones SQL: extensiones/enums, identidad/orgs/ubicaciones, propiedades/proyectos, engagement/leads/CRM, negocio/analítica, funciones/triggers (códigos, search_vector, historial de precio, contadores), RLS completo, storage + vistas |
| 5. Seed | Datos demo dominicanos (30 propiedades, 4 proyectos con unidades, 6 agencias, 2 desarrolladoras, 12 agentes) + scripts `db:migrate` / `db:seed` / `db:types` |
| 6. Layout | SiteHeader (sticky + blur, Sheet móvil, UserMenu por rol), SiteFooter, MobileTabBar, Logo, ThemeToggle |
| 7. Home | Hero + búsqueda, zonas populares, destacadas (carrusel), nuevos desarrollos, Paradise Verified, estilo de vida, cómo funciona, CTA partners |
| 8. PropertyCard | Variantes `standard/compact/horizontal/mobile/map/featured` + skeletons |
| 9. Listado | `/properties` y `/properties/[location]` (SEO): filtros completos, orden, toolbar, scroll infinito, empty state, breadcrumbs |
| 10. Detalle | Galería estilo Airbnb + lightbox, specs, amenidades agrupadas, mapa, ContactCard sticky, MobilePropertyCta, similares, freshness, JSON-LD |
| 11. Mapa | Google Maps (`@vis.gl/react-google-maps`) con marcadores de precio, mini-card, "buscar en esta zona", fallback sin key; vista split y `/map` |
| 12. Auth | Supabase Auth: login/registro/recuperación/OAuth Google, `/auth/callback`, UserMenu con sesión |
| 13. Favoritos | Zustand + localStorage, `/favorites` con sync vía `/api/collections` |
| 14. Leads | Server actions `submitLead`/`submitVisitRequest`, atribución first/last touch en cookie (server-side), dedupe de contacto, LeadForm y ScheduleVisitDialog (RHF+Zod), WhatsApp con código |
| 15. Agentes/Agencias | `/agents`, `/agent/[slug]`, `/agencies`, `/agency/[slug]`, `/developers/[slug]` |
| 16. Dashboards | Shell + StatCard + LeadPipeline + FunnelChart + LeadsTimeseries; `/agent/dashboard`, `/agency/dashboard`, `/admin`, `/dashboard` (usuario) |
| 17. Admin | Resumen del negocio: embudo, leads por día/canal, proyectos top, sidebar completo |
| 19. SEO | Metadata API + `generateMetadata` dinámico, `sitemap.xml`, `robots.txt`, JSON-LD (`RealEstateListing`, `ApartmentComplex`, `FAQPage`, `BreadcrumbList`), `opengraph-image`, URLs amigables, páginas por zona |
| 20. Analytics | Capa `analytics.track()` + sinks (GA4/Meta/TikTok/PostHog/Supabase), page_view, `/api/events` |
| — Otras páginas | `/partners` + `/partners/apply` (form real), `/contact`, `/mortgage-calculator`, `/about`, `/faq`, legal (`/privacy` `/terms` `/cookies`) |
| — Calidad | Build + lint (0 errores) · tests Vitest (utils, validation, componente) · config Playwright + specs de flujos críticos · PWA manifest |

## 🚧 Pendiente / siguientes iteraciones

- **STEP 18** — pase final de responsive + microinteracciones Framer Motion adicionales
- **Publicar propiedad** (`/list-property`) — wizard de 8 pasos con autosave (esquemas Zod listos)
- **CRM completo** (fase 2) — detalle de lead con timeline, asignación, notas; `/agent/dashboard/leads/[id]`
- **Comparador** (`/compare`) — hasta 4 propiedades
- **Búsquedas guardadas + alertas**, **notificaciones**
- **Verificación admin** (flujo de aprobación), **moderación** (DRAFT→PUBLISHED)
- Conectar **agentes/agencias/proyectos** a Supabase real (propiedades ya conectadas)
- **Developer dashboard**, gestión de **comisiones**
- **Blog** / **market insights** con datos reales
- **App móvil** (Expo) — fase 3
- **Paradise AI** (NL → filtros) — abstracción de servicio lista

## Cómo correr

```bash
pnpm install
cp .env.example apps/web/.env.local   # opcional: sin Supabase corre en modo demo
pnpm dev                              # http://localhost:3000
pnpm build && pnpm test               # build + unit tests
```
