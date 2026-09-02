# Paradise Homes RD — Arquitectura

> Documento vivo. Define **cómo** se construye Paradise Homes RD antes de escribir código.
> Orden de lectura: Arquitectura → Roles → Modelo de datos → Rutas → Componentes → Design system → Fases.

---

## 1. Visión de producto

Marketplace inmobiliario **premium** para República Dominicana que conecta compradores/interesados
con inmobiliarias, desarrolladores, constructoras, brokers, agentes y propietarios autorizados.

Paradise Homes RD **no procesa el pago del inmueble** en la fase 1. El cierre financiero ocurre
directamente entre comprador y contraparte. La plataforma monetiza vía **leads, acuerdos comerciales,
referimientos y comisiones** por operaciones originadas dentro del producto.

Las 4 preguntas que justifican cada feature:

1. ¿Ayuda a **encontrar** una propiedad?
2. ¿Ayuda a **generar** un lead?
3. ¿Ayuda al **agente a cerrar**?
4. ¿Ayuda a Paradise a **medir** el negocio?

---

## 2. Arquitectura técnica

### Monorepo (pnpm workspaces + Turborepo)

```text
paradise-homes-rd/
├── apps/
│   ├── web/                  Next.js 16 (App Router, RSC) — producto principal fase 1
│   └── mobile/               Expo / React Native (fase 3) — placeholder
├── packages/
│   ├── config/               Constantes de negocio: ubicaciones RD, tipos, amenidades, enums, rutas
│   ├── types/                Tipos de dominio derivados del schema (entidades, DTOs, enums)
│   ├── validation/           Esquemas Zod (formularios + payloads API) compartidos web/mobile
│   ├── utils/                Utilidades puras: moneda, fechas (America/Santo_Domingo), slug, códigos, analytics core
│   ├── database/             Migraciones SQL, seed, tipos generados de Supabase, factory de clientes
│   └── ui/                   Primitivos visuales compartibles (fase 3, cuando mobile lo necesite)
└── turbo.json / pnpm-workspace.yaml
```

**Regla de dependencias:** `web` y `mobile` dependen de `packages/*`. `packages/*` no dependen de `apps/*`.
`types` ← `database`. `validation` ← `types` + `config`. `utils` no depende de nada del repo.

### Web (`apps/web`)

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, Server Components por defecto |
| Lenguaje | TypeScript estricto (`strict`, `noUncheckedIndexedAccess`) |
| Estilos | Tailwind CSS v4 (`@theme`), tokens CSS, `tw-animate-css` |
| Componentes | shadcn/ui sobre Radix UI, personalizados con la identidad Paradise |
| Animación | Framer Motion (discreta, rápida) |
| Iconos | lucide-react |
| Formularios | React Hook Form + Zod (`@hookform/resolvers`) |
| Estado servidor | TanStack Query (solo donde el estado del servidor es complejo/interactivo) |
| Estado global | Zustand (comparador, filtros efímeros, UI). Sin Redux. |
| Notificaciones | Sonner |
| Mapas | `@vis.gl/react-google-maps` con fallback elegante sin API key |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Fechas | date-fns + `America/Santo_Domingo` |

**Server vs Client:** RSC para lectura de datos, SEO y layout. `"use client"` solo en islas
interactivas (filtros, galería, mapa, formularios, favoritos, comparador, menús). No marcar
árboles completos como cliente.

### Backend / datos

- **Supabase** (PostgreSQL 15+) como base de datos, auth y storage.
- **Row Level Security** en todas las tablas con datos de usuario/tenant.
- **Migraciones versionadas** en `packages/database/migrations` (`NNNN_nombre.sql`).
- **Realtime** solo donde aporta: pipeline de leads en dashboards, inventario de unidades.
- **Full-text search** en Postgres (`tsvector` + `pg_trgm`) para fase 1; abstracción para migrar a
  Typesense/Meilisearch/Algolia si el volumen lo exige.
- **Geoespacial:** columnas `latitude`/`longitude` + índice; `earthdistance`/`postgis` cuando el
  “buscar en esta zona” lo requiera.

### Data flow

```text
RSC (page/layout)  ──►  services/*  ──►  Supabase server client (cookies)  ──►  Postgres + RLS
Client island      ──►  TanStack Query  ──►  Route Handler / Server Action  ──►  services/*
Mutaciones         ──►  Server Actions (preferido) ó Route Handlers (APIs públicas / webhooks)
```

`services/` encapsula el acceso a datos (patrón repositorio ligero). Los componentes nunca hablan
directo con el cliente de Supabase.

### Infra / deployment

| Recurso | Servicio |
| --- | --- |
| Web | Vercel |
| DB / Auth / Storage | Supabase |
| Multimedia (escala) | Cloudflare R2 |
| DNS | Cloudflare |
| Email | Resend |
| Mobile builds | Expo EAS (fase 3) |
| Error monitoring | Sentry |
| Analytics | GA4 + Meta Pixel + TikTok Pixel + PostHog (capa `analytics.track()`) |

---

## 3. Roles y autorización

```text
USER              Comprador / interesado. Favoritos, búsquedas guardadas, consultas, visitas.
AGENT             Asesor inmobiliario. Sus propiedades, sus leads, agenda, analytics propios.
AGENCY_ADMIN      Administra una inmobiliaria: propiedades, proyectos, agentes, asignación de leads.
DEVELOPER         Usuario de una desarrolladora.
DEVELOPER_ADMIN   Administra una desarrolladora: proyectos, edificios, unidades, planes de pago.
ADMIN             Staff Paradise: moderación, verificaciones, soporte, analytics globales.
SUPER_ADMIN       Acceso total, configuración de plataforma, gestión de comisiones.
```

- Rol base en `profiles.role`. Membresías finas en `agency_members` / `developer_members`
  (`role` por organización: `owner | admin | manager | agent`).
- Autorización en 3 capas: **RLS** (Postgres) + **guard de rol** en Server Actions/Route Handlers +
  **UI condicional**. La UI nunca es la única barrera.
- `SUPABASE_SERVICE_ROLE_KEY` solo en código server, jamás en bundles cliente ni en `NEXT_PUBLIC_*`.

---

## 4. Modelo de datos (entidades núcleo)

Agrupadas por dominio. Detalle de columnas en `packages/database/migrations`.

### Identidad
- `profiles` — 1:1 con `auth.users`. `role`, nombre, avatar, teléfono, whatsapp, idioma, timezone.
- `agency_members` — usuario ↔ agencia (`role`, `status`, `invited_by`).
- `developer_members` — usuario ↔ desarrolladora.

### Organizaciones
- `agencies` — inmobiliaria/broker. slug, logo, descripción, `is_verified`, contacto, zonas.
- `developers` — desarrolladora/constructora. slug, logo, descripción, `is_verified`.
- `agents` — perfil público del asesor (extiende `profiles`): bio, zonas, idiomas, `response_time_minutes`, `is_verified`, `agency_id`.

### Ubicaciones
- `locations` — árbol `country → province → municipality → sector`. slug, `parent_id`, `type`,
  `latitude`, `longitude`, `is_featured`, imagen (para páginas SEO por zona).

### Propiedades
- `properties` — inmueble individual (venta/alquiler). Ver §5 de este doc y migración `0004`.
- `property_images` — url, `storage_path`, `position`, `is_cover`, `width`, `height`, `blurhash`, alt.
- `property_features` — características booleanas / valores (piscina, planta eléctrica, amueblado…).
- `property_price_history` — cambios de precio (alertas “bajó de precio”).
- `property_views` — vistas agregadas por día (freshness + analytics).

### Proyectos (obra nueva)
- `projects` — desarrollo. `developer_id`, ubicación, `delivery_estimate`, rango de precios, masterplan, video, `status`.
- `project_buildings` — torres/etapas (`Tower A`, `Tower B`).
- `project_units` — unidades: `code`, `building_id`, `level`, `unit_type`, `bedrooms`, `bathrooms`, `area_m2`, `price`, `currency`, `status` (`AVAILABLE | RESERVED | SOLD | BLOCKED`).
- `project_images`, `project_amenities`.
- `payment_plans` — `separation`, `down_payment_pct`, `during_construction_pct`, `on_delivery_pct`, notas.

### Engagement de usuario
- `favorites` — `user_id` ↔ `property_id` / `project_id`. (Sin login: localStorage → sync al autenticar.)
- `saved_searches` — filtros serializados + `alert_frequency` (`off | instant | daily | weekly`).
- `recently_viewed` — historial por usuario/sesión.

### Leads y CRM ligero
- `contacts` — persona real deduplicada por teléfono/email. Un contacto agrupa varios leads.
- `leads` — `lead_code` (`PH-L-000123`), `contact_id`, `property_id?`, `project_id?`, `unit_id?`,
  `agent_id?`, `agency_id?`, `developer_id?`, `source`, `status`, atribución (§6), `created_at`.
- `lead_activities` — timeline: evento, actor, payload, `occurred_at`.
- `lead_notes` — notas libres del agente.
- `lead_assignments` — `lead_id`, `agent_id`, `assigned_by`, `assigned_at`.
- `visits` — `lead_id`, `property_id?`/`unit_id?`, `scheduled_at`, `status`
  (`REQUESTED | SCHEDULED | COMPLETED | NO_SHOW | CANCELLED`), notas.

### Conversaciones (fase 2)
- `conversations`, `messages` — hilo comprador ↔ agente in-app.

### Negocio
- `closings` — `lead_id`, `property_id?`/`unit_id?`, `closing_amount`, `currency`, `partner`, fecha.
- `commissions` — `closing_id`, `amount`, `currency`, `status` (`PENDING | INVOICED | PAID | DISPUTED | CANCELLED`), notas.

### Confianza y moderación
- `verification_requests` — target polimórfico (`agent | agency | developer | project | property`),
  `status`, `verified_by`, `verified_at`, `notes`.
- `moderation_log` — transiciones `DRAFT → PENDING_REVIEW → PUBLISHED → REJECTED → ARCHIVED`.
- `duplicate_candidates` — `property_a`, `property_b`, `score`, señales, `resolved`.

### Analytics
- `analytics_events` — event-driven: `name`, `user_id?`, `session_id`, `property_id?`, `project_id?`,
  `lead_id?`, `props jsonb`, atribución, `occurred_at`. Fuente de verdad del funnel.
- `notifications` — `user_id`, `type`, `channel` (`email | in_app | push`), `payload`, `read_at`.

### Enums clave

```text
operation_type    : SALE | RENT
property_type      : APARTMENT | HOUSE | VILLA | PENTHOUSE | LOT | LAND | COMMERCIAL | OFFICE
property_status    : DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED | ARCHIVED
condition_status   : NEW | USED | OFF_PLAN | UNDER_CONSTRUCTION | READY_TO_MOVE
currency           : USD | DOP
lead_status        : NEW | CONTACTED | QUALIFIED | VISIT_SCHEDULED | VISIT_COMPLETED | NEGOTIATING | RESERVED | CLOSED_WON | CLOSED_LOST
unit_status        : AVAILABLE | RESERVED | SOLD | BLOCKED
verification_status: PENDING | APPROVED | REJECTED
```

---

## 5. Reglas de negocio invariantes

Una propiedad **PUBLISHED** siempre tiene: precio (o `price_on_request = true`), ubicación, contacto
(agente u organización), `status`, tipo, operación y **al menos una imagen**.

- Cada propiedad tiene `code` único e inmutable: `PH-<TIPO>-<NNNNN>` (ej. `PH-APT-00291`).
- Cada lead tiene `lead_code`: `PH-L-<NNNNNN>`.
- `slug` de propiedad: `<tipo>-<n>-habitaciones-<sector>-<code>` → SEO friendly.
- `last_verified_at`: alimenta “Disponibilidad actualizada hoy / hace N días”. Si supera el umbral,
  se solicita confirmación al agente y baja el ranking.
- Precio contractual nunca se altera por conversión de moneda: se muestra moneda original + conversión
  visual opcional.
- Timestamps en UTC; presentación en `America/Santo_Domingo`.

---

## 6. Atribución de leads (crítico — nunca se pierde el origen)

Se capturan en el primer contacto y se persisten en cookie propia (`ph_attribution`, 90 días):

```text
utm_source utm_medium utm_campaign utm_content utm_term
referrer landing_page gclid fbclid ttclid
first_touch_at  last_touch_at
```

- **first_touch** se fija una sola vez. **last_touch** se actualiza en cada visita con nuevos UTM.
- Al crear un lead se copia el snapshot de atribución completo a `leads`.
- Canales derivados: `Meta Ads | Instagram | Facebook | TikTok | Google | YouTube | organic | referral | direct`.
- Un mismo teléfono/email → un `contact`, múltiples `leads` (uno por propiedad/proyecto consultado).

---

## 7. Rutas (App Router)

### Público

```text
/                                     Home
/buy  ·  /rent  ·  /projects           Landings de operación / obra nueva
/properties                            Listado (list · map · split)
/properties/[location]                 SEO por zona: /properties/punta-cana, /properties/piantini
/property/[slug]                       Detalle de propiedad
/project/[slug]                        Detalle de proyecto
/projects                              Listado de proyectos
/map                                   Búsqueda en mapa (full screen)
/agents  ·  /agent/[slug]              Directorio y perfil de asesor
/agencies  ·  /agency/[slug]           Directorio y perfil de inmobiliaria
/developers/[slug]                     Perfil de desarrolladora
/favorites                             Favoritos (local o sincronizados)
/compare                               Comparador (hasta 4)
/partners  ·  /partners/apply          Landing B2B + aplicación de partner
/list-property                         Wizard de publicación (8 pasos, autosave)
/market  ·  /blog  ·  /blog/[slug]     Insights y contenido
/contact  ·  /about                    Institucional
/privacy  ·  /terms  ·  /cookies       Legal (placeholders marcados)
/international                          (fase 3)
```

### Autenticado — usuario

```text
/dashboard                             Resumen
/dashboard/favorites
/dashboard/searches
/dashboard/inquiries
/dashboard/visits
/dashboard/profile
```

### Autenticado — agente

```text
/agent/dashboard                       Overview + pipeline
/agent/dashboard/properties
/agent/dashboard/leads  ·  /leads/[id]
/agent/dashboard/calendar
/agent/dashboard/messages
/agent/dashboard/analytics
/agent/dashboard/profile
/agent/dashboard/settings
```

### Autenticado — agencia / desarrolladora

```text
/agency/dashboard                      Propiedades, proyectos, agentes, asignación de leads, cierres
/agency/dashboard/agents
/agency/dashboard/leads
/agency/dashboard/import
/agency/dashboard/analytics
/agency/dashboard/settings
/developer/dashboard                   (fase 2) proyectos, edificios, unidades, planes de pago
```

### Admin (Paradise)

```text
/admin                                 Overview
/admin/properties  ·  /admin/projects  ·  /admin/units
/admin/users  ·  /admin/agents  ·  /admin/agencies  ·  /admin/developers
/admin/leads  ·  /admin/visits  ·  /admin/closings
/admin/verifications
/admin/analytics  ·  /admin/marketing
/admin/content
/admin/settings
```

### API / Route Handlers

```text
/api/search                 Búsqueda con filtros (usado por islas cliente / mapa)
/api/properties             Lectura pública paginada (cursor)
/api/leads                  Creación de lead (público, rate-limited, valida atribución)
/api/favorites/sync         Sync de favoritos locales al autenticar
/api/webhooks/*             Resend / Supabase / partners (fase 2+)
/sitemap.xml  ·  /robots.txt  ·  /opengraph-image
```

Todo lo que sea mutación desde formularios del propio sitio → **Server Actions**.

---

## 8. Arquitectura de componentes (`apps/web/src`)

```text
app/                         Rutas, layouts, loading/error/not-found, metadata
components/
  ui/                        shadcn/ui personalizado (button, card, sheet, dialog, drawer…)
  layout/                    SiteHeader, SiteFooter, MobileNav, DashboardShell, Container
  property/                  PropertyCard (+variantes), PropertyGallery, PropertySpecs,
                             PropertyPrice, PropertyMap, PropertyFilters, FilterSheet,
                             FloatingContactCard, MobilePropertyCTA, SimilarProperties
  project/                   ProjectCard, ProjectGallery, UnitTable, PaymentPlan, Masterplan
  search/                    SearchBar, LocationAutocomplete, QuickSearches, LifestyleGrid,
                             SearchByOperationTabs, ResultsToolbar
  agent/                     AgentCard, AgentProfileHeader
  agency/                    AgencyCard, DeveloperCard
  lead/                      LeadForm, ScheduleVisitDialog, WhatsappButton, ContactSheet
  common/                    VerifiedBadge, FavoriteButton, ShareButton, CurrencySelector,
                             PriceDisplay, EmptyState, ErrorState, FreshnessIndicator
  dashboard/                 DashboardStatCard, DashboardChart, DataTable, LeadPipeline,
                             LeadTimeline, FunnelChart
  marketing/                 Hero, HowItWorks, PartnersCTA, Testimonials, MarketInsightsTeaser
skeletons/                   PropertyCardSkeleton, SearchSkeleton, DashboardSkeleton, GallerySkeleton
features/                    Lógica por dominio (hooks + stores + queries): search, favorites,
                             compare, leads, auth, dashboard
hooks/                       useMediaQuery, useDebounce, useLocalStorage, useAttribution,
                             useFavorites, useCompare, useInfiniteProperties
lib/                         supabase (server/client/middleware), analytics, seo, maps, cn
services/                    properties, projects, leads, agents, agencies, locations, favorites,
                             visits, analytics, verification, admin
schemas/                     Re-export de @paradise/validation + schemas específicos de web
types/                       Re-export de @paradise/types + tipos de UI
config/                      Re-export de @paradise/config + config de web (nav, site metadata)
utils/                       Helpers de UI (formatSpecs, buildWhatsappMessage, cnVariants)
```

**Contrato `PropertyCard`:** una sola API, `variant` ∈ `standard | compact | horizontal | mobile | map | featured`.
Muestra: foto (cover), precio + moneda, operación, habitaciones, baños, m², ubicación,
`VerifiedBadge`, `FavoriteButton`, agencia/agente, etiqueta destacado. Hover desktop: elevación
sutil + zoom discreto de imagen.

---

## 9. Design system

**Identidad:** startup tecnológica premium. Nada de clichés inmobiliarios (techos, casitas, llaves).
Wordmark: **Paradise Homes** + superíndice **RD**.

### Tokens (definidos en `apps/web/src/styles/globals.css` con `@theme`)

| Token | Light | Rol |
| --- | --- | --- |
| `--background` | `#FAFAF8` off-white cálido | Fondo base |
| `--foreground` | `#171717` | Texto principal |
| `--muted-foreground` | `#737373` | Texto secundario |
| `--primary` | `#163A2B` verde bosque | CTA principal, marca |
| `--primary-2` | `#1F5138` | Hover / variante clara del primario |
| `--accent` | `#B8935E` dorado champagne **discreto** | Detalles, badges premium (uso mínimo) |
| `--border` | `#E7E5E0` | Bordes suaves |
| `--card` | `#FFFFFF` | Superficies |
| `--radius` | `0.75rem` | Radio moderado |

Dark mode: se re-mapean los mismos roles (fondo `#0F1512`, superficie `#161D19`, primario más luminoso).
System / Light / Dark vía `next-themes`. La experiencia arranca en **light**.

### Tipografía

- **Geist Sans** (paquete `geist`) para todo el cuerpo y UI.
- Display: Geist con tracking negativo (`-0.02em`) en tamaños grandes, pesos 500–600.
- Escala fluida (`clamp`) para headlines editoriales del hero.
- Todo probado en español (acentos, ¿¡, ñ).

### Principios visuales

Mucho white space · tipografía grande · fotografía premium · cards sutiles · sombras muy suaves
(`0 1px 2px / 0 8px 24px -12px`) · bordes suaves · microinteracciones rápidas (150–250ms) ·
skeletons específicos · sin gradientes exagerados · sin sombras gigantes · sin saturación.

### Movimiento

Framer Motion con moderación: entrada de cards (stagger corto), transición de página sutil,
galería, sheets/drawers, corazón de favorito, hover. Duraciones 0.15–0.3s. Respeta
`prefers-reduced-motion`.

---

## 10. SEO

- Next.js Metadata API + `generateMetadata` dinámico por propiedad/proyecto/zona.
- Open Graph + Twitter cards + `opengraph-image` generada.
- Canonical URLs, `sitemap.xml` dinámico, `robots.txt`.
- JSON-LD: `RealEstateListing`, `Residence`/`Apartment`, `Offer`, `Organization`, `BreadcrumbList`.
- URLs amigables y páginas indexables por ubicación (`/properties/piantini`) sin spam.
- Performance: `next/image` (AVIF/WebP), lazy loading, streaming RSC, caché por segmento,
  objetivo Lighthouse alto y Core Web Vitals verdes.

---

## 11. Analítica y funnel

Capa única `analytics.track(event, props)` → distribuye a `analytics_events` (Supabase) + GA4 +
Meta Pixel + TikTok Pixel + PostHog, con dedupe.

Eventos: `page_view · search · property_view · project_view · favorite_added · share_clicked ·
whatsapp_clicked · phone_clicked · lead_created · visit_requested · visit_completed ·
reservation_created · closing_created`.

Funnel objetivo:

```text
Visitantes → Vistas de propiedad → Leads → Leads calificados → Visitas → Reservas → Cierres
```

Business questions que el modelo debe poder responder: leads por día, proyecto con más leads,
inmobiliaria que mejor convierte, agente que responde más rápido, campaña que genera compradores,
volumen inmobiliario originado, comisión pendiente, zonas con demanda creciente.

---

## 12. Seguridad y privacidad

RLS en todas las tablas con datos de tenant/usuario · autorización en server · verificación de rol ·
sanitización de input (Zod en frontend y backend) · rate limiting en `/api/leads` y auth ·
cookies seguras (`httpOnly`, `sameSite=lax`) · secretos solo en env vars · nunca exponer
`SUPABASE_SERVICE_ROLE_KEY`. Páginas legales con placeholders marcados hasta revisión legal.

---

## 13. Fases

| Fase | Alcance |
| --- | --- |
| **1 — MVP** | Home · búsqueda · listado · detalle propiedad · proyectos · detalle proyecto · mapa · favoritos · auth · generación de leads · tracking WhatsApp/UTM · agencias · agentes · dashboards base · admin base · publicación de propiedad · Supabase + migraciones + seed · responsive · SEO · analytics |
| **2** | CRM completo · visitas · pipeline de leads · analytics avanzado · notificaciones · búsquedas guardadas · comparador · calculadora hipotecaria · verificación · developer dashboard |
| **3** | App React Native (Expo) · push · Paradise AI (NL → filtros) · recomendaciones · market analytics · compradores internacionales · gestión avanzada de comisiones |
| **4** | Integraciones automatizadas · feeds inmobiliarios · APIs de partners · CRM avanzado · marketing automation · lead scoring · asistente IA · market intelligence |

### Orden de implementación (fase 1)

1. Estructura del monorepo → 2. Configuración del stack → 3. Design system → 4. Schema de DB →
5. Seed data → 6. Layout general → 7. Home → 8. `PropertyCard` → 9. Listado → 10. Detalle de
propiedad → 11. Mapa → 12. Auth → 13. Favoritos → 14. Sistema de leads → 15. Agentes/agencias →
16. Dashboards → 17. Admin → 18. Responsive → 19. SEO → 20. Analytics.

---

## 14. Calidad de código

TypeScript estricto · componentes pequeños · separación de responsabilidades · `services/` para
acceso a datos · hooks reusables · sin `any` gratuito · sin lógica duplicada · nombres descriptivos ·
Vitest + React Testing Library (unit) · Playwright (flujos críticos: búsqueda, detalle, lead, auth,
favoritos, publicación).
