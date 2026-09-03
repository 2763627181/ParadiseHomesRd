/**
 * Carga datos DEMO dominicanos en la base de datos (SUPABASE_DB_URL).
 * Idempotente: borra filas `is_demo = true` y las vuelve a insertar.
 * Las ubicaciones se hacen upsert por slug (no son demo).
 *
 *   pnpm db:seed
 */

import { LOCATIONS } from "@paradise/config";
import {
  demoAgencies,
  demoAgents,
  demoDevelopers,
  demoProjects,
  demoProperties,
  DEMO_SUMMARY,
} from "../src/seed-data";
import { createSql, loadEnv } from "./_env";

loadEnv();

async function main() {
  const sql = createSql();

  try {
    console.log("Sembrando datos demo de Paradise Homes RD…\n");

    // ── 1. Ubicaciones (upsert por slug) ────────────────────────────────────
    for (const loc of LOCATIONS) {
      await sql`
        insert into locations (slug, name, type, latitude, longitude, is_featured, blurb)
        values (${loc.slug}, ${loc.name}, ${loc.type}, ${loc.latitude}, ${loc.longitude},
                ${loc.isFeatured ?? false}, ${loc.blurb ?? null})
        on conflict (slug) do update set
          name = excluded.name, type = excluded.type,
          latitude = excluded.latitude, longitude = excluded.longitude,
          is_featured = excluded.is_featured, blurb = excluded.blurb
      `;
    }
    // Resolver parent_id
    for (const loc of LOCATIONS) {
      if (!loc.parentSlug) continue;
      await sql`
        update locations set parent_id = (select id from locations where slug = ${loc.parentSlug})
        where slug = ${loc.slug}
      `;
    }
    const locRows = await sql<{ id: string; slug: string }[]>`select id, slug from locations`;
    const locId = new Map(locRows.map((r) => [r.slug, r.id]));
    console.log(`  ✓ ${LOCATIONS.length} ubicaciones`);

    // ── 2. Limpiar demo previo ─────────────────────────────────────────────
    await sql`delete from properties where is_demo`;
    await sql`delete from projects where is_demo`;
    await sql`delete from agents where is_demo`;
    await sql`delete from agencies where is_demo`;
    await sql`delete from developers where is_demo`;
    await sql`delete from contacts where is_demo`;

    // ── 3. Agencias ───────────────────────────────────────────────────────
    for (const a of demoAgencies) {
      await sql`
        insert into agencies (id, slug, name, description, logo_url, cover_image_url, website,
          phone, whatsapp, email, city_id, areas, social_links, founded_year, is_verified,
          verified_at, is_demo, created_at)
        values (${a.id}, ${a.slug}, ${a.name}, ${a.description}, ${a.logoUrl}, ${a.coverImageUrl},
          ${a.website}, ${a.phone}, ${a.whatsapp}, ${a.email},
          ${a.city ? (locId.get(slugForName(a.city)) ?? null) : null},
          ${a.areas as unknown as string[]}, ${sql.json(a.socialLinks)}, ${a.foundedYear},
          ${a.isVerified}, ${a.isVerified ? a.createdAt : null}, true, ${a.createdAt})
      `;
    }
    console.log(`  ✓ ${demoAgencies.length} agencias`);

    // ── 4. Desarrolladoras ────────────────────────────────────────────────
    for (const d of demoDevelopers) {
      await sql`
        insert into developers (id, slug, name, description, logo_url, cover_image_url, website,
          phone, whatsapp, areas, founded_year, is_verified, verified_at, is_demo)
        values (${d.id}, ${d.slug}, ${d.name}, ${d.description}, ${d.logoUrl}, ${d.coverImageUrl},
          ${d.website}, ${d.phone}, ${d.whatsapp}, ${d.areas as unknown as string[]},
          ${d.foundedYear}, ${d.isVerified}, ${d.isVerified ? new Date().toISOString() : null}, true)
      `;
    }
    console.log(`  ✓ ${demoDevelopers.length} desarrolladoras`);

    // ── 5. Agentes ────────────────────────────────────────────────────────
    for (const g of demoAgents) {
      const agency = demoAgencies.find((a) => a.slug === g.agencySlug);
      await sql`
        insert into agents (id, agency_id, slug, full_name, title, bio, avatar_url, cover_image_url,
          email, phone, whatsapp, languages, areas, years_experience, response_time_minutes,
          rating_average, rating_count, social_links, is_verified, verified_at, is_demo, created_at)
        values (${g.id}, ${agency?.id ?? null}, ${g.slug}, ${g.fullName}, ${g.title}, ${g.bio},
          ${g.avatarUrl}, ${g.coverImageUrl}, ${g.email}, ${g.phone}, ${g.whatsapp},
          ${g.languages as unknown as string[]}, ${g.areas as unknown as string[]},
          ${g.yearsExperience}, ${g.responseTimeMinutes}, ${g.ratingAverage}, ${g.ratingCount},
          ${sql.json(g.socialLinks)}, ${g.isVerified}, ${g.isVerified ? g.joinedAt : null},
          true, ${g.joinedAt})
      `;
    }
    console.log(`  ✓ ${demoAgents.length} agentes`);

    // ── 6. Propiedades ────────────────────────────────────────────────────
    for (const p of demoProperties) {
      await sql`
        insert into properties (id, code, slug, title, description, operation_type, property_type,
          condition_status, price, price_on_request, currency, maintenance_fee, maintenance_fee_currency,
          bedrooms, bathrooms, parking_spaces, construction_m2, land_m2, year_built, floor, total_floors,
          furnished, pet_friendly, airbnb_friendly, address, sector_id, city_id, province_id,
          latitude, longitude, hide_exact_location, status, moderation_state, agency_id, agent_id,
          contact_name, contact_phone, contact_whatsapp, contact_email, video_url,
          is_featured, is_verified, verified_at, view_count, favorite_count, lead_count,
          is_demo, published_at, last_verified_at, created_at, updated_at)
        values (${p.id}, ${p.code}, ${p.slug}, ${p.title}, ${p.description}, ${p.operationType},
          ${p.propertyType}, ${p.conditionStatus}, ${p.price.amount}, ${p.price.onRequest ?? false},
          ${p.price.currency}, ${p.maintenanceFee?.amount ?? null}, ${p.maintenanceFee?.currency ?? null},
          ${p.bedrooms}, ${p.bathrooms}, ${p.parkingSpaces}, ${p.constructionM2}, ${p.landM2},
          ${p.yearBuilt}, ${p.floor}, ${p.totalFloors}, ${p.furnished}, ${p.petFriendly},
          ${p.airbnbFriendly}, ${p.location.address}, ${locId.get(p.location.sectorSlug ?? "") ?? null},
          ${locId.get(p.location.citySlug ?? "") ?? null}, ${locId.get(p.location.provinceSlug ?? "") ?? null},
          ${p.location.latitude}, ${p.location.longitude}, ${p.location.hideExactLocation},
          'PUBLISHED', 'PUBLISHED', ${p.agency?.id ?? null}, ${p.agent?.id ?? null},
          ${p.agent?.fullName ?? null}, ${p.agent?.phone ?? null}, ${p.agent?.whatsapp ?? null},
          ${p.agent ? `${p.agent.slug}@paradisehomesrd.com` : null}, ${p.video?.url ?? null},
          ${p.isFeatured}, ${p.isVerified}, ${p.isVerified ? p.lastVerifiedAt : null},
          ${p.viewCount}, ${p.favoriteCount}, 0, true, ${p.publishedAt}, ${p.lastVerifiedAt},
          ${p.createdAt}, ${p.updatedAt})
      `;

      for (const img of p.images) {
        await sql`
          insert into property_images (id, property_id, url, alt, width, height, position, is_cover)
          values (${img.id}, ${p.id}, ${img.url}, ${img.alt ?? null}, ${img.width ?? null},
            ${img.height ?? null}, ${img.position}, ${img.isCover})
        `;
      }
      for (const key of p.amenityKeys) {
        await sql`insert into property_amenities (property_id, key) values (${p.id}, ${key}) on conflict do nothing`;
        await sql`
          insert into property_features (property_id, key, label, value, group_key)
          values (${p.id}, ${key}, ${key}, 'true', 'edificio')
          on conflict (property_id, key) do nothing
        `;
      }
      for (const ph of p.priceHistory) {
        await sql`
          insert into property_price_history (property_id, price, currency, changed_at)
          values (${p.id}, ${ph.price}, ${ph.currency}, ${ph.changedAt})
        `;
      }
    }
    console.log(`  ✓ ${demoProperties.length} propiedades`);

    // ── 7. Proyectos ──────────────────────────────────────────────────────
    for (const prj of demoProjects) {
      await sql`
        insert into projects (id, code, slug, name, description, developer_id, address,
          sector_id, city_id, province_id, latitude, longitude, status, moderation_state,
          price_from, price_to, currency, delivery_estimate, bedrooms_min, bedrooms_max,
          amenity_keys, is_verified, is_featured, is_demo, published_at, created_at, updated_at)
        values (${prj.id}, ${prj.code}, ${prj.slug}, ${prj.name}, ${prj.description},
          ${prj.developer?.id ?? null}, ${prj.location.address},
          ${locId.get(prj.location.sectorSlug ?? "") ?? null},
          ${locId.get(prj.location.citySlug ?? "") ?? null},
          ${locId.get(prj.location.provinceSlug ?? "") ?? null},
          ${prj.location.latitude}, ${prj.location.longitude}, ${prj.status}, 'PUBLISHED',
          ${prj.priceFrom.amount}, ${prj.priceTo?.amount ?? null}, ${prj.priceFrom.currency},
          ${prj.deliveryEstimate}, ${prj.bedroomsRange?.[0] ?? null}, ${prj.bedroomsRange?.[1] ?? null},
          ${prj.amenityKeys as unknown as string[]}, ${prj.isVerified}, ${prj.isFeatured}, true,
          ${prj.createdAt}, ${prj.createdAt}, ${prj.updatedAt})
      `;
      for (const b of prj.buildings) {
        await sql`
          insert into project_buildings (id, project_id, name, position, floors)
          values (${b.id}, ${prj.id}, ${b.name}, ${b.position}, ${b.floors})
        `;
      }
      for (const u of prj.units) {
        await sql`
          insert into project_units (id, project_id, building_id, code, label, level, unit_type,
            bedrooms, bathrooms, area_m2, price, currency, status)
          values (${u.id}, ${prj.id}, ${u.buildingId}, ${u.code}, ${u.label}, ${u.level},
            ${u.unitType}, ${u.bedrooms}, ${u.bathrooms}, ${u.areaM2}, ${u.price}, ${u.currency}, ${u.status})
        `;
      }
      for (const img of prj.images) {
        await sql`
          insert into project_images (id, project_id, url, alt, position, is_cover)
          values (${img.id}, ${prj.id}, ${img.url}, ${img.alt ?? null}, ${img.position}, ${img.isCover})
        `;
      }
      for (const plan of prj.paymentPlans) {
        await sql`
          insert into payment_plans (id, project_id, name, separation_amount, separation_currency,
            down_payment_pct, during_construction_pct, on_delivery_pct, notes, is_default)
          values (${plan.id}, ${prj.id}, ${plan.name}, ${plan.separationAmount?.amount ?? null},
            ${plan.separationAmount?.currency ?? "USD"}, ${plan.downPaymentPct},
            ${plan.duringConstructionPct}, ${plan.onDeliveryPct}, ${plan.notes}, ${plan.isDefault})
        `;
      }
    }
    console.log(`  ✓ ${demoProjects.length} proyectos (${DEMO_SUMMARY.units} unidades)`);

    // ── 8. Recontar property_count por ubicación ──────────────────────────
    await sql`
      update locations l set property_count = sub.c from (
        select loc_id, count(*) c from (
          select unnest(array[sector_id, city_id, province_id]) loc_id
          from properties where status = 'PUBLISHED'
        ) x where loc_id is not null group by loc_id
      ) sub where l.id = sub.loc_id
    `;

    console.log("\n✓ Seed completo.\n");
  } finally {
    await sql.end();
  }
}

/** Nombre de ciudad → slug (para resolver agencies.city_id). */
function slugForName(name: string): string {
  const found = LOCATIONS.find((l) => l.name === name);
  return found?.slug ?? "";
}

main().catch((error) => {
  console.error("\n✗ Error en el seed:\n", error);
  process.exit(1);
});
