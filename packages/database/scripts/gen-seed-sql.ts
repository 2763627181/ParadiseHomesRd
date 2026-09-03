/**
 * Genera `packages/database/seed.sql` con los datos DEMO como sentencias SQL
 * puras, para pegar en el SQL Editor de Supabase (sin necesidad de conexión
 * directa a Postgres).
 *
 *   pnpm --filter @paradise/database exec tsx scripts/gen-seed-sql.ts
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LOCATIONS } from "@paradise/config";
import {
  demoAgencies,
  demoAgents,
  demoDevelopers,
  demoProjects,
  demoProperties,
  DEMO_SUMMARY,
} from "../src/seed-data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../seed.sql");

/** Escapa un valor a literal SQL. */
function v(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (Array.isArray(value)) {
    const items = value.map((item) => `"${String(item).replace(/"/g, '\\"')}"`).join(",");
    return `'{${items}}'`;
  }
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** Resuelve `(select id from locations where slug = '...')` o null. */
function locId(slug: string | null | undefined): string {
  if (!slug) return "null";
  return `(select id from locations where slug = ${v(slug)})`;
}

const nameToSlug = new Map(LOCATIONS.map((l) => [l.name, l.slug]));

const lines: string[] = [];
const w = (s = "") => lines.push(s);

w("-- ═══════════════════════════════════════════════════════════════════════════");
w("-- Paradise Homes RD — Datos DEMO (generado). Pega en el SQL Editor de Supabase.");
w("-- Requiere haber ejecutado antes schema.sql.");
w("-- Idempotente: borra las filas is_demo y las re-inserta.");
w("-- ═══════════════════════════════════════════════════════════════════════════");
w();
w("begin;");
w();

// ── Ubicaciones (upsert por slug) ──────────────────────────────────────────
w("-- Ubicaciones");
for (const loc of LOCATIONS) {
  w(
    `insert into locations (slug, name, type, latitude, longitude, is_featured, blurb) values (` +
      `${v(loc.slug)}, ${v(loc.name)}, ${v(loc.type)}, ${v(loc.latitude)}, ${v(loc.longitude)}, ` +
      `${v(loc.isFeatured ?? false)}, ${v(loc.blurb ?? null)}) ` +
      `on conflict (slug) do update set name = excluded.name, type = excluded.type, ` +
      `latitude = excluded.latitude, longitude = excluded.longitude, ` +
      `is_featured = excluded.is_featured, blurb = excluded.blurb;`,
  );
}
w();
for (const loc of LOCATIONS) {
  if (!loc.parentSlug) continue;
  w(
    `update locations set parent_id = ${locId(loc.parentSlug)} where slug = ${v(loc.slug)};`,
  );
}
w();

// ── Limpiar demo previo ────────────────────────────────────────────────────
w("-- Limpiar demo previo");
for (const t of ["properties", "projects", "agents", "agencies", "developers", "contacts"]) {
  w(`delete from ${t} where is_demo;`);
}
w();

// ── Agencias ───────────────────────────────────────────────────────────────
w("-- Agencias");
for (const a of demoAgencies) {
  w(
    `insert into agencies (id, slug, name, description, logo_url, cover_image_url, website, phone, whatsapp, email, city_id, areas, social_links, founded_year, is_verified, verified_at, is_demo, created_at) values (` +
      `${v(a.id)}, ${v(a.slug)}, ${v(a.name)}, ${v(a.description)}, ${v(a.logoUrl)}, ${v(a.coverImageUrl)}, ${v(a.website)}, ${v(a.phone)}, ${v(a.whatsapp)}, ${v(a.email)}, ` +
      `${locId(a.city ? nameToSlug.get(a.city) : null)}, ${v(a.areas)}, ${v(a.socialLinks)}, ${v(a.foundedYear)}, ${v(a.isVerified)}, ${v(a.isVerified ? a.createdAt : null)}, true, ${v(a.createdAt)});`,
  );
}
w();

// ── Desarrolladoras ────────────────────────────────────────────────────────
w("-- Desarrolladoras");
for (const d of demoDevelopers) {
  w(
    `insert into developers (id, slug, name, description, logo_url, cover_image_url, website, phone, whatsapp, areas, founded_year, is_verified, verified_at, is_demo) values (` +
      `${v(d.id)}, ${v(d.slug)}, ${v(d.name)}, ${v(d.description)}, ${v(d.logoUrl)}, ${v(d.coverImageUrl)}, ${v(d.website)}, ${v(d.phone)}, ${v(d.whatsapp)}, ${v(d.areas)}, ${v(d.foundedYear)}, ${v(d.isVerified)}, now(), true);`,
  );
}
w();

// ── Agentes ────────────────────────────────────────────────────────────────
w("-- Agentes");
for (const g of demoAgents) {
  const agency = demoAgencies.find((a) => a.slug === g.agencySlug);
  w(
    `insert into agents (id, agency_id, slug, full_name, title, bio, avatar_url, cover_image_url, email, phone, whatsapp, languages, areas, years_experience, response_time_minutes, rating_average, rating_count, social_links, is_verified, verified_at, is_demo, created_at) values (` +
      `${v(g.id)}, ${v(agency?.id ?? null)}, ${v(g.slug)}, ${v(g.fullName)}, ${v(g.title)}, ${v(g.bio)}, ${v(g.avatarUrl)}, ${v(g.coverImageUrl)}, ${v(g.email)}, ${v(g.phone)}, ${v(g.whatsapp)}, ` +
      `${v(g.languages)}, ${v(g.areas)}, ${v(g.yearsExperience)}, ${v(g.responseTimeMinutes)}, ${v(g.ratingAverage)}, ${v(g.ratingCount)}, ${v(g.socialLinks)}, ${v(g.isVerified)}, ${v(g.isVerified ? g.joinedAt : null)}, true, ${v(g.joinedAt)});`,
  );
}
w();

// ── Propiedades ────────────────────────────────────────────────────────────
w("-- Propiedades");
for (const p of demoProperties) {
  w(
    `insert into properties (id, code, slug, title, description, operation_type, property_type, condition_status, price, price_on_request, currency, maintenance_fee, maintenance_fee_currency, bedrooms, bathrooms, parking_spaces, construction_m2, land_m2, year_built, floor, total_floors, furnished, pet_friendly, airbnb_friendly, address, sector_id, city_id, province_id, latitude, longitude, hide_exact_location, status, moderation_state, agency_id, agent_id, contact_name, contact_phone, contact_whatsapp, contact_email, video_url, is_featured, is_verified, verified_at, view_count, favorite_count, lead_count, is_demo, published_at, last_verified_at, created_at, updated_at) values (` +
      `${v(p.id)}, ${v(p.code)}, ${v(p.slug)}, ${v(p.title)}, ${v(p.description)}, ${v(p.operationType)}, ${v(p.propertyType)}, ${v(p.conditionStatus)}, ${v(p.price.amount)}, ${v(p.price.onRequest ?? false)}, ${v(p.price.currency)}, ` +
      `${v(p.maintenanceFee?.amount ?? null)}, ${v(p.maintenanceFee?.currency ?? null)}, ${v(p.bedrooms)}, ${v(p.bathrooms)}, ${v(p.parkingSpaces)}, ${v(p.constructionM2)}, ${v(p.landM2)}, ${v(p.yearBuilt)}, ${v(p.floor)}, ${v(p.totalFloors)}, ` +
      `${v(p.furnished)}, ${v(p.petFriendly)}, ${v(p.airbnbFriendly)}, ${v(p.location.address)}, ${locId(p.location.sectorSlug)}, ${locId(p.location.citySlug)}, ${locId(p.location.provinceSlug)}, ${v(p.location.latitude)}, ${v(p.location.longitude)}, ${v(p.location.hideExactLocation)}, ` +
      `'PUBLISHED', 'PUBLISHED', ${v(p.agency?.id ?? null)}, ${v(p.agent?.id ?? null)}, ${v(p.agent?.fullName ?? null)}, ${v(p.agent?.phone ?? null)}, ${v(p.agent?.whatsapp ?? null)}, ${v(p.agent ? `${p.agent.slug}@paradisehomesrd.com` : null)}, ${v(p.video?.url ?? null)}, ` +
      `${v(p.isFeatured)}, ${v(p.isVerified)}, ${v(p.isVerified ? p.lastVerifiedAt : null)}, ${v(p.viewCount)}, ${v(p.favoriteCount)}, 0, true, ${v(p.publishedAt)}, ${v(p.lastVerifiedAt)}, ${v(p.createdAt)}, ${v(p.updatedAt)});`,
  );
  for (const img of p.images) {
    w(
      `insert into property_images (id, property_id, url, alt, width, height, position, is_cover) values (${v(img.id)}, ${v(p.id)}, ${v(img.url)}, ${v(img.alt ?? null)}, ${v(img.width ?? null)}, ${v(img.height ?? null)}, ${v(img.position)}, ${v(img.isCover)});`,
    );
  }
  for (const key of p.amenityKeys) {
    w(`insert into property_amenities (property_id, key) values (${v(p.id)}, ${v(key)}) on conflict do nothing;`);
    w(
      `insert into property_features (property_id, key, label, value, group_key) values (${v(p.id)}, ${v(key)}, ${v(key)}, 'true', 'edificio') on conflict (property_id, key) do nothing;`,
    );
  }
}
w();

// ── Proyectos ──────────────────────────────────────────────────────────────
w("-- Proyectos");
for (const prj of demoProjects) {
  w(
    `insert into projects (id, code, slug, name, description, developer_id, address, sector_id, city_id, province_id, latitude, longitude, status, moderation_state, price_from, price_to, currency, delivery_estimate, bedrooms_min, bedrooms_max, amenity_keys, is_verified, is_featured, is_demo, published_at, created_at, updated_at) values (` +
      `${v(prj.id)}, ${v(prj.code)}, ${v(prj.slug)}, ${v(prj.name)}, ${v(prj.description)}, ${v(prj.developer?.id ?? null)}, ${v(prj.location.address)}, ${locId(prj.location.sectorSlug)}, ${locId(prj.location.citySlug)}, ${locId(prj.location.provinceSlug)}, ` +
      `${v(prj.location.latitude)}, ${v(prj.location.longitude)}, ${v(prj.status)}, 'PUBLISHED', ${v(prj.priceFrom.amount)}, ${v(prj.priceTo?.amount ?? null)}, ${v(prj.priceFrom.currency)}, ${v(prj.deliveryEstimate ? prj.deliveryEstimate.slice(0, 10) : null)}, ` +
      `${v(prj.bedroomsRange?.[0] ?? null)}, ${v(prj.bedroomsRange?.[1] ?? null)}, ${v(prj.amenityKeys)}, ${v(prj.isVerified)}, ${v(prj.isFeatured)}, true, ${v(prj.createdAt)}, ${v(prj.createdAt)}, ${v(prj.updatedAt)});`,
  );
  for (const b of prj.buildings) {
    w(
      `insert into project_buildings (id, project_id, name, position, floors) values (${v(b.id)}, ${v(prj.id)}, ${v(b.name)}, ${v(b.position)}, ${v(b.floors)});`,
    );
  }
  for (const u of prj.units) {
    w(
      `insert into project_units (id, project_id, building_id, code, label, level, unit_type, bedrooms, bathrooms, area_m2, price, currency, status) values (` +
        `${v(u.id)}, ${v(prj.id)}, ${v(u.buildingId)}, ${v(u.code)}, ${v(u.label)}, ${v(u.level)}, ${v(u.unitType)}, ${v(u.bedrooms)}, ${v(u.bathrooms)}, ${v(u.areaM2)}, ${v(u.price)}, ${v(u.currency)}, ${v(u.status)});`,
    );
  }
  for (const img of prj.images) {
    w(
      `insert into project_images (id, project_id, url, alt, position, is_cover) values (${v(img.id)}, ${v(prj.id)}, ${v(img.url)}, ${v(img.alt ?? null)}, ${v(img.position)}, ${v(img.isCover)});`,
    );
  }
  for (const plan of prj.paymentPlans) {
    w(
      `insert into payment_plans (id, project_id, name, separation_amount, separation_currency, down_payment_pct, during_construction_pct, on_delivery_pct, notes, is_default) values (` +
        `${v(plan.id)}, ${v(prj.id)}, ${v(plan.name)}, ${v(plan.separationAmount?.amount ?? null)}, ${v(plan.separationAmount?.currency ?? "USD")}, ${v(plan.downPaymentPct)}, ${v(plan.duringConstructionPct)}, ${v(plan.onDeliveryPct)}, ${v(plan.notes)}, ${v(plan.isDefault)});`,
    );
  }
}
w();

// ── Recontar property_count ────────────────────────────────────────────────
w("-- Recontar propiedades por ubicación");
w(`update locations l set property_count = coalesce(sub.c, 0) from (
  select loc_id, count(*) c from (
    select unnest(array[sector_id, city_id, province_id]) loc_id
    from properties where status = 'PUBLISHED'
  ) x where loc_id is not null group by loc_id
) sub where l.id = sub.loc_id;`);
w();
w("commit;");
w();
w(
  `-- Resumen: ${DEMO_SUMMARY.properties} propiedades · ${DEMO_SUMMARY.projects} proyectos (${DEMO_SUMMARY.units} unidades) · ${DEMO_SUMMARY.agencies} agencias · ${DEMO_SUMMARY.developers} desarrolladoras · ${DEMO_SUMMARY.agents} agentes`,
);

writeFileSync(OUT, lines.join("\n") + "\n", "utf8");
console.log(`✓ ${OUT} (${lines.length} sentencias)`);
