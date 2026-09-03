-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0006 · Funciones y triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- ── updated_at automático ───────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles','agencies','developers','agents','organization_members',
    'projects','project_units','properties','contacts','leads','visits',
    'commissions'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on %1$s
       for each row execute function set_updated_at()', t);
  end loop;
end$$;

-- ── perfil automático al registrarse ────────────────────────────────────────
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Usuario'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── código legible de propiedad ─────────────────────────────────────────────
create or replace function property_type_prefix(pt property_type)
returns text language sql immutable as $$
  select case pt
    when 'APARTMENT'  then 'APT'
    when 'HOUSE'      then 'CAS'
    when 'VILLA'      then 'VIL'
    when 'PENTHOUSE'  then 'PEN'
    when 'LOT'        then 'SOL'
    when 'LAND'       then 'TER'
    when 'COMMERCIAL' then 'LOC'
    when 'OFFICE'     then 'OFI'
  end;
$$;

create or replace function assign_property_code()
returns trigger language plpgsql as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'PH-' || property_type_prefix(new.property_type) || '-' ||
                lpad(nextval('property_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;
create trigger trg_properties_code before insert on properties
  for each row execute function assign_property_code();

create or replace function assign_project_code()
returns trigger language plpgsql as $$
begin
  if new.code is null or new.code = '' then
    new.code := 'PH-PRJ-' || lpad(nextval('project_code_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;
create trigger trg_projects_code before insert on projects
  for each row execute function assign_project_code();

create or replace function assign_lead_code()
returns trigger language plpgsql as $$
begin
  if new.lead_code is null or new.lead_code = '' then
    new.lead_code := 'PH-L-' || lpad(nextval('lead_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;
create trigger trg_leads_code before insert on leads
  for each row execute function assign_lead_code();

create or replace function assign_visit_code()
returns trigger language plpgsql as $$
begin
  if new.visit_code is null or new.visit_code = '' then
    new.visit_code := 'PH-V-' || lpad(nextval('visit_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;
create trigger trg_visits_code before insert on visits
  for each row execute function assign_visit_code();

create or replace function assign_closing_code()
returns trigger language plpgsql as $$
begin
  if new.closing_code is null or new.closing_code = '' then
    new.closing_code := 'PH-C-' || lpad(nextval('closing_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;
create trigger trg_closings_code before insert on closings
  for each row execute function assign_closing_code();

create or replace function assign_commission_code()
returns trigger language plpgsql as $$
begin
  if new.commission_code is null or new.commission_code = '' then
    new.commission_code := 'PH-CM-' || lpad(nextval('commission_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;
create trigger trg_commissions_code before insert on commissions
  for each row execute function assign_commission_code();

-- ── search_vector de propiedades ───────────────────────────────────────────
create or replace function properties_search_vector_update()
returns trigger
language plpgsql
set search_path = public, extensions, pg_catalog
as $$
declare
  sector_name text;
  city_name text;
  province_name text;
  cfg regconfig := 'public.es_unaccent'::regconfig;
begin
  select name into sector_name from locations where id = new.sector_id;
  select name into city_name from locations where id = new.city_id;
  select name into province_name from locations where id = new.province_id;

  new.search_vector :=
    setweight(to_tsvector(cfg, coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector(cfg,
      coalesce(sector_name,'') || ' ' || coalesce(city_name,'') || ' ' || coalesce(province_name,'')), 'A') ||
    setweight(to_tsvector(cfg, coalesce(new.code, '')), 'A') ||
    setweight(to_tsvector(cfg, coalesce(new.address, '')), 'B') ||
    setweight(to_tsvector(cfg, coalesce(new.description, '')), 'C');
  return new;
end;
$$;
create trigger trg_properties_search_vector
  before insert or update of title, description, address, sector_id, city_id, province_id, code
  on properties
  for each row execute function properties_search_vector_update();

-- ── historial de precio + last_verified_at ─────────────────────────────────
create or replace function properties_price_history()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.price is not null then
    insert into property_price_history (property_id, price, currency)
    values (new.id, new.price, new.currency);
  elsif tg_op = 'UPDATE' and new.price is distinct from old.price and new.price is not null then
    insert into property_price_history (property_id, price, currency)
    values (new.id, new.price, new.currency);
  end if;
  return new;
end;
$$;
create trigger trg_properties_price_history
  after insert or update of price on properties
  for each row execute function properties_price_history();

-- ── contador de favoritos ──────────────────────────────────────────────────
create or replace function favorites_count_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.property_id is not null then
    update properties set favorite_count = favorite_count + 1 where id = new.property_id;
  elsif tg_op = 'DELETE' and old.property_id is not null then
    update properties set favorite_count = greatest(0, favorite_count - 1) where id = old.property_id;
  end if;
  return null;
end;
$$;
create trigger trg_favorites_count
  after insert or delete on favorites
  for each row execute function favorites_count_sync();

-- ── contador de leads + primer/último touch ────────────────────────────────
create or replace function leads_after_insert()
returns trigger language plpgsql as $$
begin
  if new.property_id is not null then
    update properties set lead_count = lead_count + 1 where id = new.property_id;
  end if;

  insert into lead_activities (lead_id, type, title, body, occurred_at)
  values (new.id, 'lead_created',
          'Lead generado desde ' || coalesce(new.source::text, 'direct'),
          new.message, new.created_at);
  return null;
end;
$$;
create trigger trg_leads_after_insert
  after insert on leads
  for each row execute function leads_after_insert();

-- ── property_count por ubicación (provincia/municipio/sector) ──────────────
create or replace function recount_location_properties(loc uuid)
returns void language sql as $$
  update locations l set property_count = (
    select count(*) from properties p
    where p.status = 'PUBLISHED'
      and (p.sector_id = l.id or p.city_id = l.id or p.province_id = l.id)
  ) where l.id = loc;
$$;
