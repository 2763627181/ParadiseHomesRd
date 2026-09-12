-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0014 · Mantener locations.property_count al día
--
-- BUG: `recount_location_properties(loc)` existe desde la migración 0006 pero
-- ningún trigger la llamaba — `locations.property_count` solo se llenó con el
-- seed inicial y nunca se volvió a tocar. Resultado: "Explora por zona" en el
-- home mostraba conteos viejos (p. ej. "14 propiedades") aunque el catálogo
-- real cambiara (incluso a cero).
--
-- FIX: trigger sobre `properties` que recalcula el conteo de la(s) ubicación(es)
-- afectada(s) — sector, ciudad y provincia — en cada INSERT/UPDATE/DELETE.
-- Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function trg_recount_location_properties()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    if old.sector_id is not null then perform recount_location_properties(old.sector_id); end if;
    if old.city_id is not null then perform recount_location_properties(old.city_id); end if;
    if old.province_id is not null then perform recount_location_properties(old.province_id); end if;
    return old;
  end if;

  if new.sector_id is not null then perform recount_location_properties(new.sector_id); end if;
  if new.city_id is not null then perform recount_location_properties(new.city_id); end if;
  if new.province_id is not null then perform recount_location_properties(new.province_id); end if;

  if tg_op = 'UPDATE' then
    if old.sector_id is distinct from new.sector_id and old.sector_id is not null then
      perform recount_location_properties(old.sector_id);
    end if;
    if old.city_id is distinct from new.city_id and old.city_id is not null then
      perform recount_location_properties(old.city_id);
    end if;
    if old.province_id is distinct from new.province_id and old.province_id is not null then
      perform recount_location_properties(old.province_id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_properties_recount_locations on properties;
create trigger trg_properties_recount_locations
  after insert or update of status, sector_id, city_id, province_id or delete on properties
  for each row execute function trg_recount_location_properties();

-- Recalcula ya mismo todas las ubicaciones (corrige los conteos viejos del seed).
do $$
declare loc record;
begin
  for loc in select id from locations loop
    perform recount_location_properties(loc.id);
  end loop;
end$$;
