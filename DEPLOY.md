# Desplegar Paradise Homes RD en Vercel

La web (`apps/web`) es una app Next.js 16 dentro de un monorepo pnpm + Turborepo.
Backend: Supabase (ya configurado). No hace falta servidor propio.

---

## 1. Subir el código a GitHub

```bash
git push origin main
```

El repo ya está conectado a `github.com/2763627181/ParadiseHomesRd`.

---

## 2. Importar el proyecto en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) e inicia sesión (puedes usar tu cuenta de GitHub).
2. **Import Git Repository** → elige `ParadiseHomesRd`.
3. En la configuración del proyecto:
   - **Root Directory**: `apps/web`  ← importante, no dejarlo en la raíz.
   - **Framework Preset**: Next.js (se detecta solo).
   - **Build Command**: dejar el que sugiere (`next build`).
   - **Install Command**: dejar el default — Vercel detecta pnpm por el campo
     `packageManager` del `package.json` raíz.
4. **NO** hagas deploy todavía: primero agrega las variables de entorno (paso 3).

---

## 3. Variables de entorno

En **Settings → Environment Variables** (aplica a Production, Preview y Development salvo que se indique).
Copia los valores desde tu `apps/web/.env.local` local **excepto `NEXT_PUBLIC_APP_URL`**, que cambia.

### Obligatorias

| Variable | Valor | Notas |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xzczevhutiwigvlqwlpx.supabase.co` | igual que en local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (el `eyJ...` `anon` de tu `.env.local`) | igual que en local |
| `SUPABASE_SERVICE_ROLE_KEY` | (el `eyJ...` `service_role`) | **secreto** — solo server |
| `NEXT_PUBLIC_APP_URL` | `https://paradise-homes-rd-web.vercel.app` (o tu dominio propio cuando lo tengas) | **distinto a local** |
| `NEXT_PUBLIC_APP_NAME` | `Paradise Homes RD` | |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | tu número (formato `1849...`) | |
| `NEXT_PUBLIC_ADMIN_CONTACT_NAME` | tu nombre | |

### Opcionales (recomendadas)

| Variable | Para qué |
|---|---|
| `RESEND_API_KEY` | Envío de **correos** de notificación (nuevo lead, mensaje, visita, verificación). Sin esta clave, las notificaciones **in-app siguen funcionando**, solo no salen correos. Crea la key en [resend.com](https://resend.com) con permiso **Sending access** (no hace falta Full access — la app solo envía correos, no administra dominios). |
| `RESEND_FROM_EMAIL` | Remitente, p. ej. `Paradise Homes RD <notificaciones@tudominio.com>`. Debe ser de un **dominio verificado** en Resend. Si aún no tienes dominio propio, deja este módulo para después: Resend solo deja enviar desde `onboarding@resend.dev` **a tu propio correo verificado**, no a terceros. |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Mapas reales en `/map` y en el detalle. Sin ella se muestra un fallback. |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | ID de estilo del mapa de Google. |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_TIKTOK_PIXEL_ID` / `NEXT_PUBLIC_POSTHOG_KEY` | Analítica y píxeles (opcionales). |
| `NEXT_PUBLIC_SENTRY_DSN` | Reporte de errores. |
| `CRON_SECRET` | Token para el cron de **alertas de búsquedas guardadas** (`apps/web/vercel.json` lo programa a diario). Pon cualquier string largo y aleatorio; Vercel manda ese header automáticamente. Sin esta variable el cron responde 401 y no se envían alertas. En plan Hobby el cron corre 1×/día; para alertas "instantáneas" reales sube la frecuencia en `vercel.json` (requiere plan Pro). |

Luego dale a **Deploy**.

---

## 4. Después del primer deploy: ajustar Supabase Auth

Ya que el login con Google funciona en local, para que funcione en producción:

1. Supabase → **Authentication → URL Configuration**
   - **Site URL**: `https://paradise-homes-rd-web.vercel.app`
   - **Redirect URLs**: agrega estas dos
     ```
     https://paradise-homes-rd-web.vercel.app/auth/callback
     https://paradise-homes-rd-web.vercel.app/auth/set-password
     ```
     (`/auth/set-password` es donde aterrizan los correos de restablecer
     contraseña y las invitaciones a socios/asesores). Deja también las
     versiones `http://localhost:3000/...` si sigues probando en local.

No hace falta tocar Google Cloud: el redirect de Google apunta a Supabase
(`https://xzczevhutiwigvlqwlpx.supabase.co/auth/v1/callback`), que ya está configurado.

---

## 5. Migraciones SQL pendientes

Ejecuta en el **SQL Editor de Supabase**, una sola vez, en orden:

- `packages/database/migrations/0010_fix_contacts_unique.sql` — si aún no lo corriste.
- `packages/database/migrations/0011_realtime.sql` — habilita **tiempo real** para
  mensajería y notificaciones (sin esto, ambas funcionan igual pero se actualizan
  por sondeo cada 5–15 s en vez de al instante).
- `packages/database/migrations/0012_agent_reviews.sql` — reseñas de asesores
  (tabla `agent_reviews` + trigger que recalcula `rating_average`/`rating_count`).
- `packages/database/migrations/0013_blog.sql` — blog (`/admin/content` para
  redactar, `/blog` público). Antes de correrla, `/blog` muestra "sin artículos"
  y el editor de admin avisa que falta la migración.

Todas están concatenadas en `packages/database/schema.sql` si prefieres pegar
solo lo nuevo desde ese archivo.

---

## 6. Dominio propio (opcional)

Vercel → **Settings → Domains** → agrega tu dominio y sigue las instrucciones de DNS.
Después actualiza `NEXT_PUBLIC_APP_URL` y el Site URL / Redirect URL de Supabase con el nuevo dominio.

---

## 7. Checklist de humo tras el deploy

- [ ] La home carga.
- [ ] `/properties` lista propiedades reales.
- [ ] Login con Google entra y te deja en `/dashboard`.
- [ ] `/admin` bloquea el acceso si tu cuenta no es `ADMIN`/`SUPER_ADMIN`.
      Para promoverte, en el SQL Editor de Supabase:
      ```sql
      update profiles set role = 'SUPER_ADMIN' where email = 'joshuasteven486@gmail.com';
      ```
      (primero inicia sesión una vez en producción para que exista tu fila en `profiles`).
- [ ] `/list-property` deja completar el wizard y subir fotos.
- [ ] Enviar una consulta desde una propiedad crea el lead (revisa `/admin/leads`).
- [ ] Con `RESEND_API_KEY`: al enviar ese lead llega un correo al asesor.

---

## 8. Solución de problemas post-deploy

### “El almacenamiento no está disponible” al subir fotos

Había **dos causas**:

1. **Bug de código (ya corregido).** `src/lib/env.ts` leía las variables
   `NEXT_PUBLIC_*` con acceso dinámico (`process.env[nombre]`). Next.js solo
   inyecta en el bundle del navegador las que se escriben literalmente
   (`process.env.NEXT_PUBLIC_SUPABASE_URL`). Resultado: en el navegador
   `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY` quedaban `undefined`, el cliente de
   Supabase no se creaba y el subidor decía “almacenamiento no disponible”
   aunque el servidor sí funcionara. Corregido: ahora se leen literales. El
   mismo bug afectaba al mapa.

2. **Variables en Vercel.** Aun con el código bueno, necesitas las claves en el
   entorno de build:
   - Vercel → **Settings → Environment Variables** → confirma que existen
     `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para
     **Production** (mismos valores que en `apps/web/.env.local`).
   - Vercel → **Deployments** → último deploy → `···` → **Redeploy**. Los
     cambios de variables `NEXT_PUBLIC_*` NO aplican a un deploy ya hecho: se
     hornean al compilar.
   - Prueba de nuevo en `/list-property` paso 6.

### Google Maps (“Mapa no disponible”)

1. [console.cloud.google.com](https://console.cloud.google.com) → mismo proyecto
   que usaste para el login con Google (o uno nuevo).
2. **APIs y servicios → Biblioteca** → habilita **Maps JavaScript API**.
   (Opcional: **Places API** si luego quieres autocompletado de direcciones.)
3. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
4. Restríngela: en la clave, **Restricciones de aplicación → Sitios web (HTTP
   referrers)** y agrega:
   ```
   https://paradise-homes-rd-web.vercel.app/*
   http://localhost:3000/*
   ```
   En **Restricciones de API** deja solo *Maps JavaScript API*.
5. Copia la clave y en Vercel agrega:
   `NEXT_PUBLIC_GOOGLE_MAPS_KEY = <la clave>`
   (opcional `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` si creas un estilo de mapa).
6. **Redeploy**.

> No hace falta tarjeta para empezar, pero Google Maps pide facturación
> activada para quitar el watermark “For development purposes only”. El crédito
> mensual gratuito de Google cubre de sobra el tráfico inicial.

### ¿Cloudflare?

- **Dominio en Cloudflare:** apunta el dominio a Vercel siguiendo *Sección 6* de
  este documento (Vercel te da los registros; en Cloudflare ponlos con el proxy
  en **DNS only / gris** para el registro que Vercel indique). Luego cambia
  `NEXT_PUBLIC_APP_URL` y las URLs de Supabase Auth al dominio nuevo y redeploy.
- **Almacenamiento de imágenes:** no hace falta Cloudflare R2 — Supabase Storage
  ya está integrado y funciona (5 GB gratis). Solo migra a R2 si superas ese
  límite; requiere un pequeño cambio de código que se puede hacer después.
