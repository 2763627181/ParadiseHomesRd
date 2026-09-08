-- ═══════════════════════════════════════════════════════════════════════════
-- Paradise Homes RD — Schema completo (generado desde migrations/*.sql)
--
-- USO: Supabase Dashboard → SQL Editor → New query → pega TODO esto → Run.
-- Ejecútalo una sola vez sobre una base limpia. Luego ejecuta seed.sql.
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══ 0001_init_extensions_enums.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0001 · Extensiones y tipos ENUM
--
-- En Supabase las extensiones viven en el schema `extensions`. Este archivo es
-- idempotente y seguro tanto en Supabase como en un Postgres local.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  ext_schema text := case
    when exists (select 1 from pg_namespace where nspname = 'extensions') then 'extensions'
    else 'public'
  end;
begin
  execute format('create extension if not exists pgcrypto  with schema %I', ext_schema);
  execute format('create extension if not exists pg_trgm   with schema %I', ext_schema);
  execute format('create extension if not exists unaccent  with schema %I', ext_schema);
  execute format('create extension if not exists citext    with schema %I', ext_schema);
  execute format('create extension if not exists cube      with schema %I', ext_schema);
  execute format('create extension if not exists earthdistance with schema %I', ext_schema);
end$$;

-- Config de búsqueda en español que ignora acentos.
do $$
declare
  unaccent_ref text;
begin
  if exists (select 1 from pg_ts_config where cfgname = 'es_unaccent') then
    return;
  end if;

  select n.nspname || '.unaccent'
    into unaccent_ref
  from pg_ts_dict d
  join pg_namespace n on n.oid = d.dictnamespace
  where d.dictname = 'unaccent'
  limit 1;

  create text search configuration es_unaccent (copy = spanish);
  execute format(
    'alter text search configuration es_unaccent alter mapping for hword, hword_part, word with %s, spanish_stem',
    coalesce(unaccent_ref, 'unaccent')
  );
end$$;

-- ── ENUMs ────────────────────────────────────────────────────────────────────
create type operation_type as enum ('SALE', 'RENT');

create type property_type as enum (
  'APARTMENT', 'HOUSE', 'VILLA', 'PENTHOUSE', 'LOT', 'LAND', 'COMMERCIAL', 'OFFICE'
);

create type property_status as enum (
  'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'
);

create type condition_status as enum (
  'NEW', 'USED', 'OFF_PLAN', 'UNDER_CONSTRUCTION', 'READY_TO_MOVE'
);

create type currency_code as enum ('USD', 'DOP');

create type location_type as enum ('COUNTRY', 'PROVINCE', 'MUNICIPALITY', 'SECTOR');

create type user_role as enum (
  'USER', 'AGENT', 'AGENCY_ADMIN', 'DEVELOPER', 'DEVELOPER_ADMIN', 'ADMIN', 'SUPER_ADMIN'
);

create type org_member_role as enum ('owner', 'admin', 'manager', 'agent');
create type org_member_status as enum ('active', 'invited', 'suspended');
create type org_type as enum ('agency', 'developer');

create type lead_status as enum (
  'NEW', 'CONTACTED', 'QUALIFIED', 'VISIT_SCHEDULED', 'VISIT_COMPLETED',
  'NEGOTIATING', 'RESERVED', 'CLOSED_WON', 'CLOSED_LOST'
);

create type lead_source as enum (
  'meta_ads', 'instagram', 'facebook', 'tiktok', 'google', 'youtube',
  'organic', 'referral', 'direct'
);

create type lead_channel as enum (
  'property_form', 'whatsapp', 'phone', 'schedule_visit',
  'partner_application', 'list_property', 'contact_page'
);

create type visit_status as enum (
  'REQUESTED', 'SCHEDULED', 'COMPLETED', 'NO_SHOW', 'CANCELLED'
);

create type unit_status as enum ('AVAILABLE', 'RESERVED', 'SOLD', 'BLOCKED');

create type project_status as enum (
  'PRE_SALE', 'UNDER_CONSTRUCTION', 'READY', 'DELIVERED', 'SOLD_OUT'
);

create type verification_status as enum ('PENDING', 'APPROVED', 'REJECTED');
create type verification_target as enum ('agent', 'agency', 'developer', 'project', 'property');

create type commission_status as enum ('PENDING', 'INVOICED', 'PAID', 'DISPUTED', 'CANCELLED');

create type alert_frequency as enum ('off', 'instant', 'daily', 'weekly');
create type notification_channel as enum ('email', 'in_app', 'push');

create type moderation_state as enum (
  'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'
);


-- ═══ 0002_identity_orgs_locations.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0002 · Identidad, organizaciones y ubicaciones
-- ─────────────────────────────────────────────────────────────────────────────

-- ── profiles (1:1 con auth.users) ───────────────────────────────────────────
create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text not null default 'Usuario',
  email         citext,
  phone         text,
  whatsapp      text,
  avatar_url    text,
  role          user_role not null default 'USER',
  locale        text not null default 'es',
  timezone      text not null default 'America/Santo_Domingo',
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table profiles is 'Perfil de aplicación; extiende auth.users.';

-- ── locations (árbol país → provincia → municipio → sector) ──────────────────
create table locations (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null,
  type           location_type not null,
  parent_id      uuid references locations (id) on delete set null,
  latitude       double precision not null,
  longitude      double precision not null,
  is_featured    boolean not null default false,
  blurb          text,
  image_url      text,
  property_count integer not null default 0,
  created_at     timestamptz not null default now()
);
create index locations_parent_idx on locations (parent_id);
create index locations_type_idx on locations (type);
create index locations_name_trgm_idx on locations using gin (name gin_trgm_ops);

-- ── agencies ────────────────────────────────────────────────────────────────
create table agencies (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  logo_url        text,
  cover_image_url text,
  website         text,
  phone           text,
  whatsapp        text,
  email           citext,
  city_id         uuid references locations (id) on delete set null,
  areas           text[] not null default '{}',
  social_links    jsonb not null default '{}'::jsonb,
  founded_year    integer,
  is_verified     boolean not null default false,
  verified_at     timestamptz,
  verified_by     uuid references profiles (id) on delete set null,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index agencies_verified_idx on agencies (is_verified);

-- ── developers ──────────────────────────────────────────────────────────────
create table developers (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name            text not null,
  description     text,
  logo_url        text,
  cover_image_url text,
  website         text,
  phone           text,
  whatsapp        text,
  areas           text[] not null default '{}',
  founded_year    integer,
  is_verified     boolean not null default false,
  verified_at     timestamptz,
  verified_by     uuid references profiles (id) on delete set null,
  is_demo         boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── agents (perfil público del asesor) ──────────────────────────────────────
create table agents (
  id                     uuid primary key default gen_random_uuid(),
  profile_id             uuid unique references profiles (id) on delete set null,
  agency_id              uuid references agencies (id) on delete set null,
  slug                   text not null unique,
  full_name              text not null,
  title                  text,
  bio                    text,
  avatar_url             text,
  cover_image_url        text,
  email                  citext,
  phone                  text,
  whatsapp               text,
  languages              text[] not null default '{"Español"}',
  areas                  text[] not null default '{}',
  years_experience       integer,
  response_time_minutes  integer,
  rating_average         numeric(2,1),
  rating_count           integer not null default 0,
  social_links           jsonb not null default '{}'::jsonb,
  is_verified            boolean not null default false,
  verified_at            timestamptz,
  verified_by            uuid references profiles (id) on delete set null,
  is_demo                boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index agents_agency_idx on agents (agency_id);
create index agents_verified_idx on agents (is_verified);
create index agents_name_trgm_idx on agents using gin (full_name gin_trgm_ops);

-- ── membresías por organización ─────────────────────────────────────────────
create table organization_members (
  id                uuid primary key default gen_random_uuid(),
  organization_type org_type not null,
  agency_id         uuid references agencies (id) on delete cascade,
  developer_id      uuid references developers (id) on delete cascade,
  profile_id        uuid not null references profiles (id) on delete cascade,
  role              org_member_role not null default 'agent',
  status            org_member_status not null default 'active',
  invited_by        uuid references profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint org_member_target_ck check (
    (organization_type = 'agency'    and agency_id is not null and developer_id is null) or
    (organization_type = 'developer' and developer_id is not null and agency_id is null)
  ),
  unique (agency_id, profile_id),
  unique (developer_id, profile_id)
);
create index org_members_profile_idx on organization_members (profile_id);


-- ═══ 0003_properties_projects.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0003 · Propiedades y proyectos
-- ─────────────────────────────────────────────────────────────────────────────

-- Secuencias para códigos legibles (PH-APT-00001, PH-PRJ-00001, ...)
create sequence property_code_seq start 1;
create sequence project_code_seq start 1;
create sequence lead_code_seq start 1;
create sequence visit_code_seq start 1;
create sequence closing_code_seq start 1;
create sequence commission_code_seq start 1;

-- ── projects ────────────────────────────────────────────────────────────────
create table projects (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  slug               text not null unique,
  name               text not null,
  description        text not null default '',
  developer_id       uuid references developers (id) on delete set null,
  agency_id          uuid references agencies (id) on delete set null,

  address            text,
  sector_id          uuid references locations (id) on delete set null,
  city_id            uuid references locations (id) on delete set null,
  province_id        uuid references locations (id) on delete set null,
  latitude           double precision,
  longitude          double precision,

  status             project_status not null default 'PRE_SALE',
  moderation_state   moderation_state not null default 'DRAFT',

  price_from         numeric(14,2),
  price_to           numeric(14,2),
  currency           currency_code not null default 'USD',
  delivery_estimate  date,

  bedrooms_min       integer,
  bedrooms_max       integer,

  masterplan_url     text,
  video_url          text,
  amenity_keys       text[] not null default '{}',

  is_verified        boolean not null default false,
  is_featured        boolean not null default false,
  is_demo            boolean not null default false,

  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index projects_status_idx on projects (status);
create index projects_city_idx on projects (city_id);
create index projects_developer_idx on projects (developer_id);
create index projects_featured_idx on projects (is_featured) where is_featured;

create table project_buildings (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects (id) on delete cascade,
  name        text not null,
  position    integer not null default 0,
  floors      integer,
  created_at  timestamptz not null default now()
);
create index project_buildings_project_idx on project_buildings (project_id);

create table project_units (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references projects (id) on delete cascade,
  building_id    uuid references project_buildings (id) on delete set null,
  code           text not null,
  label          text not null,
  level          integer,
  unit_type      property_type not null default 'APARTMENT',
  bedrooms       integer,
  bathrooms      numeric(3,1),
  area_m2        numeric(8,2),
  price          numeric(14,2),
  currency       currency_code not null default 'USD',
  status         unit_status not null default 'AVAILABLE',
  floor_plan_url text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (project_id, code)
);
create index project_units_project_idx on project_units (project_id);
create index project_units_status_idx on project_units (status);

create table project_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects (id) on delete cascade,
  url          text not null,
  storage_path text,
  alt          text,
  width        integer,
  height       integer,
  blur_data_url text,
  position     integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now()
);
create index project_images_project_idx on project_images (project_id, position);

create table payment_plans (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references projects (id) on delete cascade,
  name                    text not null default 'Plan estándar',
  separation_amount       numeric(14,2),
  separation_currency     currency_code not null default 'USD',
  down_payment_pct        numeric(5,2) not null default 0,
  during_construction_pct numeric(5,2) not null default 0,
  on_delivery_pct         numeric(5,2) not null default 0,
  notes                   text,
  is_default              boolean not null default false,
  created_at              timestamptz not null default now()
);
create index payment_plans_project_idx on payment_plans (project_id);

-- ── properties ──────────────────────────────────────────────────────────────
create table properties (
  id                 uuid primary key default gen_random_uuid(),
  code               text not null unique,
  slug               text not null unique,

  title              text not null,
  description        text not null default '',

  operation_type     operation_type not null,
  property_type      property_type not null,
  condition_status   condition_status,

  price              numeric(14,2),
  price_on_request   boolean not null default false,
  currency           currency_code not null default 'USD',
  maintenance_fee    numeric(12,2),
  maintenance_fee_currency currency_code,

  bedrooms           integer,
  bathrooms          numeric(3,1),
  parking_spaces     integer,
  construction_m2    numeric(10,2),
  land_m2            numeric(12,2),
  year_built         integer,
  floor              integer,
  total_floors       integer,

  furnished          boolean not null default false,
  pet_friendly       boolean not null default false,
  airbnb_friendly    boolean not null default false,

  address            text,
  sector_id          uuid references locations (id) on delete set null,
  city_id            uuid references locations (id) on delete set null,
  province_id        uuid references locations (id) on delete set null,
  country            text not null default 'República Dominicana',
  latitude           double precision,
  longitude          double precision,
  hide_exact_location boolean not null default false,

  status             property_status not null default 'DRAFT',
  moderation_state   moderation_state not null default 'DRAFT',
  reject_reason      text,

  agency_id          uuid references agencies (id) on delete set null,
  agent_id           uuid references agents (id) on delete set null,
  developer_id       uuid references developers (id) on delete set null,
  project_id         uuid references projects (id) on delete set null,
  owner_profile_id   uuid references profiles (id) on delete set null,

  contact_name       text,
  contact_phone      text,
  contact_whatsapp   text,
  contact_email      citext,

  video_url          text,
  virtual_tour_url   text,

  is_featured        boolean not null default false,
  is_verified        boolean not null default false,
  verified_at        timestamptz,
  verified_by        uuid references profiles (id) on delete set null,

  view_count         integer not null default 0,
  favorite_count     integer not null default 0,
  lead_count         integer not null default 0,

  is_demo            boolean not null default false,

  search_vector      tsvector,

  published_at       timestamptz,
  last_verified_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint properties_price_ck check (price_on_request or price is not null),
  constraint properties_price_positive_ck check (price is null or price >= 0)
);

create index properties_status_idx on properties (status);
create index properties_operation_idx on properties (operation_type);
create index properties_type_idx on properties (property_type);
create index properties_condition_idx on properties (condition_status);
create index properties_price_idx on properties (price);
create index properties_bedrooms_idx on properties (bedrooms);
create index properties_city_idx on properties (city_id);
create index properties_sector_idx on properties (sector_id);
create index properties_province_idx on properties (province_id);
create index properties_agency_idx on properties (agency_id);
create index properties_agent_idx on properties (agent_id);
create index properties_project_idx on properties (project_id);
create index properties_published_idx on properties (published_at desc);
create index properties_featured_idx on properties (is_featured) where is_featured;
create index properties_geo_idx on properties (latitude, longitude);
create index properties_search_idx on properties using gin (search_vector);
create index properties_active_browse_idx
  on properties (status, operation_type, published_at desc)
  where status = 'PUBLISHED';

create table property_images (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties (id) on delete cascade,
  url           text not null,
  storage_path  text,
  alt           text,
  width         integer,
  height        integer,
  blur_data_url text,
  position      integer not null default 0,
  is_cover      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index property_images_property_idx on property_images (property_id, position);
create unique index property_images_one_cover_idx
  on property_images (property_id) where is_cover;

create table property_features (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  key         text not null,
  label       text not null,
  value       text,
  group_key   text not null default 'interior',
  unique (property_id, key)
);
create index property_features_property_idx on property_features (property_id);
create index property_features_key_idx on property_features (key);

create table property_amenities (
  property_id uuid not null references properties (id) on delete cascade,
  key         text not null,
  primary key (property_id, key)
);

create table property_price_history (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties (id) on delete cascade,
  price        numeric(14,2) not null,
  currency     currency_code not null,
  changed_at   timestamptz not null default now()
);
create index property_price_history_property_idx on property_price_history (property_id, changed_at desc);


-- ═══ 0004_engagement_leads_crm.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0004 · Engagement de usuario + Leads / CRM ligero
-- ─────────────────────────────────────────────────────────────────────────────

-- ── favoritos ───────────────────────────────────────────────────────────────
create table favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  property_id uuid references properties (id) on delete cascade,
  project_id  uuid references projects (id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint favorites_target_ck check (num_nonnulls(property_id, project_id) = 1),
  unique (user_id, property_id),
  unique (user_id, project_id)
);
create index favorites_user_idx on favorites (user_id, created_at desc);

-- ── búsquedas guardadas ─────────────────────────────────────────────────────
create table saved_searches (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles (id) on delete cascade,
  name             text not null,
  params           jsonb not null,
  alert_frequency  alert_frequency not null default 'instant',
  last_run_at      timestamptz,
  last_seen_at     timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index saved_searches_user_idx on saved_searches (user_id);

-- ── vistas recientes ────────────────────────────────────────────────────────
create table recently_viewed (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles (id) on delete cascade,
  session_id  text,
  property_id uuid references properties (id) on delete cascade,
  project_id  uuid references projects (id) on delete cascade,
  viewed_at   timestamptz not null default now(),
  constraint recently_viewed_target_ck check (num_nonnulls(property_id, project_id) = 1),
  constraint recently_viewed_actor_ck check (num_nonnulls(user_id, session_id) >= 1)
);
create index recently_viewed_user_idx on recently_viewed (user_id, viewed_at desc);
create index recently_viewed_session_idx on recently_viewed (session_id, viewed_at desc);

-- ── contacts (persona deduplicada) ──────────────────────────────────────────
create table contacts (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  email       citext,
  phone       text,
  whatsapp    text,
  profile_id  uuid references profiles (id) on delete set null,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
-- Índices únicos NO parciales: Postgres ya trata cada NULL como distinto, así
-- que múltiples contactos sin teléfono/correo son válidos de todas formas, y
-- estos índices sí sirven de destino para `.upsert(..., { onConflict: "phone" })`
-- (un índice único PARCIAL no puede usarse ahí salvo que el upsert repita el
-- WHERE exacto). Ver 0010_fix_contacts_unique.sql para el porqué.
create unique index contacts_phone_key on contacts (phone);
create unique index contacts_email_key on contacts (email);

-- ── leads ───────────────────────────────────────────────────────────────────
create table leads (
  id                uuid primary key default gen_random_uuid(),
  lead_code         text not null unique,
  contact_id        uuid not null references contacts (id) on delete cascade,

  property_id       uuid references properties (id) on delete set null,
  project_id        uuid references projects (id) on delete set null,
  unit_id           uuid references project_units (id) on delete set null,

  agent_id          uuid references agents (id) on delete set null,
  agency_id         uuid references agencies (id) on delete set null,
  developer_id      uuid references developers (id) on delete set null,

  source            lead_source not null default 'direct',
  channel           lead_channel not null default 'property_form',
  status            lead_status not null default 'NEW',
  message           text,
  intent            text not null default 'info',

  campaign          text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_content       text,
  utm_term          text,
  gclid             text,
  fbclid            text,
  ttclid            text,
  referrer          text,
  landing_page      text,
  first_touch       jsonb,
  last_touch        jsonb,

  assigned_at       timestamptz,
  assigned_by       uuid references profiles (id) on delete set null,
  next_activity_at  timestamptz,
  contacted_at      timestamptz,
  qualified_at      timestamptz,
  closed_at         timestamptz,

  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index leads_status_idx on leads (status);
create index leads_agent_idx on leads (agent_id);
create index leads_agency_idx on leads (agency_id);
create index leads_property_idx on leads (property_id);
create index leads_project_idx on leads (project_id);
create index leads_contact_idx on leads (contact_id);
create index leads_source_idx on leads (source);
create index leads_created_idx on leads (created_at desc);

create table lead_activities (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads (id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  actor_id    uuid references profiles (id) on delete set null,
  actor_name  text,
  metadata    jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index lead_activities_lead_idx on lead_activities (lead_id, occurred_at desc);

create table lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads (id) on delete cascade,
  author_id   uuid not null references profiles (id) on delete cascade,
  author_name text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index lead_notes_lead_idx on lead_notes (lead_id, created_at desc);

create table lead_assignments (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads (id) on delete cascade,
  agent_id    uuid not null references agents (id) on delete cascade,
  assigned_by uuid references profiles (id) on delete set null,
  assigned_at timestamptz not null default now()
);
create index lead_assignments_lead_idx on lead_assignments (lead_id, assigned_at desc);

-- ── visitas ─────────────────────────────────────────────────────────────────
create table visits (
  id            uuid primary key default gen_random_uuid(),
  visit_code    text not null unique,
  lead_id       uuid not null references leads (id) on delete cascade,
  property_id   uuid references properties (id) on delete set null,
  unit_id       uuid references project_units (id) on delete set null,
  agent_id      uuid references agents (id) on delete set null,
  scheduled_at  timestamptz,
  status        visit_status not null default 'REQUESTED',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index visits_lead_idx on visits (lead_id);
create index visits_agent_idx on visits (agent_id, scheduled_at);
create index visits_status_idx on visits (status);

-- ── conversaciones (fase 2, tablas creadas desde ya) ────────────────────────
create table conversations (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references leads (id) on delete set null,
  property_id  uuid references properties (id) on delete set null,
  buyer_id     uuid references profiles (id) on delete set null,
  agent_id     uuid references agents (id) on delete set null,
  last_message_at timestamptz,
  created_at   timestamptz not null default now()
);

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id       uuid references profiles (id) on delete set null,
  body            text not null,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);
create index messages_conversation_idx on messages (conversation_id, created_at);


-- ═══ 0005_business_analytics.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0005 · Negocio, confianza, moderación y analítica
-- ─────────────────────────────────────────────────────────────────────────────

-- ── closings ────────────────────────────────────────────────────────────────
create table closings (
  id             uuid primary key default gen_random_uuid(),
  closing_code   text not null unique,
  lead_id        uuid references leads (id) on delete set null,
  property_id    uuid references properties (id) on delete set null,
  unit_id        uuid references project_units (id) on delete set null,
  agent_id       uuid references agents (id) on delete set null,
  agency_id      uuid references agencies (id) on delete set null,
  developer_id   uuid references developers (id) on delete set null,
  closing_amount numeric(16,2) not null,
  currency       currency_code not null default 'USD',
  partner_name   text,
  closed_at      date not null default current_date,
  notes          text,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now()
);
create index closings_agent_idx on closings (agent_id);
create index closings_closed_at_idx on closings (closed_at desc);

-- ── commissions (registro interno; NO procesa dinero) ───────────────────────
create table commissions (
  id               uuid primary key default gen_random_uuid(),
  commission_code  text not null unique,
  closing_id       uuid not null references closings (id) on delete cascade,
  amount           numeric(14,2) not null,
  currency         currency_code not null default 'USD',
  status           commission_status not null default 'PENDING',
  notes            text,
  invoiced_at      timestamptz,
  paid_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index commissions_status_idx on commissions (status);

-- ── verificaciones (Paradise Verified) ──────────────────────────────────────
create table verification_requests (
  id           uuid primary key default gen_random_uuid(),
  target_type  verification_target not null,
  target_id    uuid not null,
  status       verification_status not null default 'PENDING',
  submitted_by uuid references profiles (id) on delete set null,
  reviewed_by  uuid references profiles (id) on delete set null,
  notes        text,
  evidence     jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  reviewed_at  timestamptz
);
create index verification_requests_target_idx on verification_requests (target_type, target_id);
create index verification_requests_status_idx on verification_requests (status);

-- ── moderación ──────────────────────────────────────────────────────────────
create table moderation_log (
  id          uuid primary key default gen_random_uuid(),
  entity_type text not null,           -- 'property' | 'project'
  entity_id   uuid not null,
  from_state  moderation_state,
  to_state    moderation_state not null,
  actor_id    uuid references profiles (id) on delete set null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index moderation_log_entity_idx on moderation_log (entity_type, entity_id, created_at desc);

-- ── candidatos a duplicado (arquitectura preparada) ─────────────────────────
create table duplicate_candidates (
  id          uuid primary key default gen_random_uuid(),
  property_a  uuid not null references properties (id) on delete cascade,
  property_b  uuid not null references properties (id) on delete cascade,
  score       numeric(4,3) not null,
  signals     jsonb not null default '{}'::jsonb,  -- {address, coords, price, phone, images, description}
  resolved    boolean not null default false,
  resolution  text,                                 -- 'same' | 'different' | 'merged'
  resolved_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint duplicate_pair_ck check (property_a < property_b),
  unique (property_a, property_b)
);
create index duplicate_candidates_open_idx on duplicate_candidates (resolved) where not resolved;

-- ── partner applications (/partners/apply) ──────────────────────────────────
create table partner_applications (
  id             uuid primary key default gen_random_uuid(),
  company_name   text not null,
  partner_type   text not null,
  contact_name   text not null,
  email          citext not null,
  phone          text not null,
  whatsapp       text,
  website        text,
  instagram      text,
  inventory_size text,
  locations      text[] not null default '{}',
  message        text,
  status         text not null default 'new',  -- new | contacted | approved | rejected
  utm            jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

-- ── notificaciones ─────────────────────────────────────────────────────────
create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  type        text not null,
  channel     notification_channel not null default 'in_app',
  title       text not null,
  body        text,
  payload     jsonb not null default '{}'::jsonb,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, created_at desc);
create index notifications_unread_idx on notifications (user_id) where read_at is null;

-- ── analytics events (fuente de verdad del funnel) ─────────────────────────
create table analytics_events (
  id           bigint generated always as identity primary key,
  name         text not null,
  session_id   text,
  user_id      uuid references profiles (id) on delete set null,
  property_id  uuid references properties (id) on delete set null,
  project_id   uuid references projects (id) on delete set null,
  lead_id      uuid references leads (id) on delete set null,
  agent_id     uuid references agents (id) on delete set null,
  agency_id    uuid references agencies (id) on delete set null,
  props        jsonb not null default '{}'::jsonb,
  utm_source   text,
  utm_medium   text,
  utm_campaign text,
  path         text,
  occurred_at  timestamptz not null default now()
);
create index analytics_events_name_idx on analytics_events (name, occurred_at desc);
create index analytics_events_property_idx on analytics_events (property_id);
create index analytics_events_session_idx on analytics_events (session_id);
create index analytics_events_occurred_idx on analytics_events (occurred_at desc);

-- Vistas agregadas por día (freshness + tendencias sin escanear el evento crudo)
create table property_daily_stats (
  property_id uuid not null references properties (id) on delete cascade,
  day         date not null,
  views       integer not null default 0,
  leads       integer not null default 0,
  favorites   integer not null default 0,
  primary key (property_id, day)
);

-- ── mortgage calculator log (opcional, para insights) ──────────────────────
create table mortgage_calculations (
  id            uuid primary key default gen_random_uuid(),
  session_id    text,
  property_id   uuid references properties (id) on delete set null,
  price         numeric(14,2) not null,
  down_payment  numeric(14,2) not null,
  annual_rate   numeric(5,2) not null,
  years         integer not null,
  monthly       numeric(14,2) not null,
  created_at    timestamptz not null default now()
);


-- ═══ 0006_functions_triggers.sql ═══════════════════════════════════════════════

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


-- ═══ 0007_rls_policies.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0007 · Row Level Security
--
-- Modelo:
--  · Contenido público (propiedades/proyectos PUBLISHED, agencias, agentes,
--    ubicaciones) es legible por cualquiera (anon incluido).
--  · Cada usuario ve/gestiona sus propios favoritos, búsquedas y consultas.
--  · Agentes/agencias gestionan su inventario y sus leads.
--  · Staff (ADMIN, SUPER_ADMIN) tiene acceso amplio.
--  · El service role (backend) omite RLS: se usa para escrituras controladas
--    (creación de leads, analítica, moderación).
-- ─────────────────────────────────────────────────────────────────────────────

-- Helpers -------------------------------------------------------------------
-- SECURITY DEFINER + search_path fijo: estas funciones se llaman DENTRO de las
-- políticas RLS, así que NO deben disparar RLS de nuevo (evita recursión infinita
-- en `profiles`). Leen con privilegios del owner y solo devuelven un booleano/id.
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('ADMIN', 'SUPER_ADMIN') from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function is_agency_member(target_agency uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.profile_id = auth.uid()
      and m.agency_id = target_agency
      and m.status = 'active'
  );
$$;

create or replace function is_developer_member(target_developer uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.profile_id = auth.uid()
      and m.developer_id = target_developer
      and m.status = 'active'
  );
$$;

create or replace function current_agent_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from agents where profile_id = auth.uid();
$$;

-- Helpers para romper la recursión mutua entre las políticas de `contacts` y `leads`.
create or replace function contact_belongs_to_user(c_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from contacts c where c.id = c_id and c.profile_id = auth.uid());
$$;

create or replace function agent_owns_contact(c_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from leads l
    where l.contact_id = c_id
      and (
        l.agent_id = current_agent_id()
        or is_agency_member(l.agency_id)
        or is_developer_member(l.developer_id)
      )
  );
$$;

-- Enable RLS --------------------------------------------------------------------
alter table profiles                enable row level security;
alter table locations               enable row level security;
alter table agencies                enable row level security;
alter table developers              enable row level security;
alter table agents                  enable row level security;
alter table organization_members    enable row level security;
alter table projects                enable row level security;
alter table project_buildings       enable row level security;
alter table project_units           enable row level security;
alter table project_images          enable row level security;
alter table payment_plans           enable row level security;
alter table properties              enable row level security;
alter table property_images         enable row level security;
alter table property_features       enable row level security;
alter table property_amenities      enable row level security;
alter table property_price_history  enable row level security;
alter table favorites               enable row level security;
alter table saved_searches          enable row level security;
alter table recently_viewed         enable row level security;
alter table contacts                enable row level security;
alter table leads                   enable row level security;
alter table lead_activities         enable row level security;
alter table lead_notes              enable row level security;
alter table lead_assignments        enable row level security;
alter table visits                  enable row level security;
alter table conversations           enable row level security;
alter table messages                enable row level security;
alter table closings                enable row level security;
alter table commissions             enable row level security;
alter table verification_requests   enable row level security;
alter table moderation_log          enable row level security;
alter table duplicate_candidates    enable row level security;
alter table partner_applications    enable row level security;
alter table notifications           enable row level security;
alter table analytics_events        enable row level security;
alter table property_daily_stats    enable row level security;
alter table mortgage_calculations   enable row level security;

-- profiles --------------------------------------------------------------------
create policy "profiles_self_select" on profiles for select using (id = auth.uid() or is_staff());
create policy "profiles_self_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_staff_all"   on profiles for all using (is_staff()) with check (is_staff());

-- locations (público, escritura solo staff) ----------------------------------
create policy "locations_public_read" on locations for select using (true);
create policy "locations_staff_write" on locations for all using (is_staff()) with check (is_staff());

-- agencies / developers / agents (perfiles públicos) ------------------------
create policy "agencies_public_read" on agencies for select using (true);
create policy "agencies_member_update" on agencies for update
  using (is_agency_member(id) or is_staff()) with check (is_agency_member(id) or is_staff());
create policy "agencies_staff_write" on agencies for all using (is_staff()) with check (is_staff());

create policy "developers_public_read" on developers for select using (true);
create policy "developers_member_update" on developers for update
  using (is_developer_member(id) or is_staff()) with check (is_developer_member(id) or is_staff());
create policy "developers_staff_write" on developers for all using (is_staff()) with check (is_staff());

create policy "agents_public_read" on agents for select using (true);
create policy "agents_self_update" on agents for update
  using (profile_id = auth.uid() or is_staff()) with check (profile_id = auth.uid() or is_staff());
create policy "agents_staff_write" on agents for all using (is_staff()) with check (is_staff());

create policy "org_members_visible" on organization_members for select
  using (profile_id = auth.uid() or is_agency_member(agency_id) or is_developer_member(developer_id) or is_staff());
create policy "org_members_manage" on organization_members for all
  using (is_staff() or is_agency_member(agency_id) or is_developer_member(developer_id))
  with check (is_staff() or is_agency_member(agency_id) or is_developer_member(developer_id));

-- projects & children -------------------------------------------------------
create policy "projects_public_read" on projects for select
  using (moderation_state = 'PUBLISHED' or is_staff()
         or is_developer_member(developer_id) or is_agency_member(agency_id));
create policy "projects_owner_write" on projects for all
  using (is_staff() or is_developer_member(developer_id) or is_agency_member(agency_id))
  with check (is_staff() or is_developer_member(developer_id) or is_agency_member(agency_id));

create policy "project_children_read" on project_buildings for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "project_children_write" on project_buildings for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));

create policy "project_units_read" on project_units for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "project_units_write" on project_units for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));

create policy "project_images_read" on project_images for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "project_images_write" on project_images for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (true);

create policy "payment_plans_read" on payment_plans for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "payment_plans_write" on payment_plans for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (true);

-- properties & children ---------------------------------------------------
create policy "properties_public_read" on properties for select
  using (
    status = 'PUBLISHED'
    or is_staff()
    or owner_profile_id = auth.uid()
    or agent_id = current_agent_id()
    or is_agency_member(agency_id)
    or is_developer_member(developer_id)
  );
create policy "properties_owner_write" on properties for all
  using (
    is_staff()
    or owner_profile_id = auth.uid()
    or agent_id = current_agent_id()
    or is_agency_member(agency_id)
    or is_developer_member(developer_id)
  )
  with check (
    is_staff()
    or owner_profile_id = auth.uid()
    or agent_id = current_agent_id()
    or is_agency_member(agency_id)
    or is_developer_member(developer_id)
  );

create policy "property_images_read" on property_images for select
  using (exists (select 1 from properties p where p.id = property_id
                 and (p.status = 'PUBLISHED' or is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))));
create policy "property_images_write" on property_images for all
  using (exists (select 1 from properties p where p.id = property_id
                 and (is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))))
  with check (true);

create policy "property_features_read" on property_features for select using (true);
create policy "property_features_write" on property_features for all
  using (exists (select 1 from properties p where p.id = property_id
                 and (is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))))
  with check (true);

create policy "property_amenities_read" on property_amenities for select using (true);
create policy "property_amenities_write" on property_amenities for all
  using (exists (select 1 from properties p where p.id = property_id
                 and (is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))))
  with check (true);

create policy "price_history_read" on property_price_history for select using (true);

-- favorites / saved searches / recently viewed --------------------------------
create policy "favorites_own" on favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved_searches_own" on saved_searches for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recently_viewed_own" on recently_viewed for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- contacts / leads / CRM -----------------------------------------------------
-- El contacto es visible para el dueño (si tiene profile), el agente/agencia
-- del lead asociado, y staff.
create policy "contacts_visibility" on contacts for select using (
  profile_id = auth.uid()
  or is_staff()
  or agent_owns_contact(id)
);

create policy "leads_visibility" on leads for select using (
  is_staff()
  or agent_id = current_agent_id()
  or is_agency_member(agency_id)
  or is_developer_member(developer_id)
  or contact_belongs_to_user(contact_id)
);
create policy "leads_agent_agency_update" on leads for update using (
  is_staff() or agent_id = current_agent_id() or is_agency_member(agency_id) or is_developer_member(developer_id)
) with check (
  is_staff() or agent_id = current_agent_id() or is_agency_member(agency_id) or is_developer_member(developer_id)
);

create policy "lead_children_visibility" on lead_activities for select using (
  exists (select 1 from leads l where l.id = lead_id and (
    is_staff() or l.agent_id = current_agent_id() or is_agency_member(l.agency_id) or is_developer_member(l.developer_id)
  ))
);
create policy "lead_notes_rw" on lead_notes for all using (
  exists (select 1 from leads l where l.id = lead_id and (
    is_staff() or l.agent_id = current_agent_id() or is_agency_member(l.agency_id)
  ))
) with check (author_id = auth.uid());
create policy "lead_assignments_visibility" on lead_assignments for select using (
  exists (select 1 from leads l where l.id = lead_id and (
    is_staff() or l.agent_id = current_agent_id() or is_agency_member(l.agency_id)
  ))
);
create policy "lead_assignments_manage" on lead_assignments for all using (
  is_staff() or exists (select 1 from leads l where l.id = lead_id and is_agency_member(l.agency_id))
) with check (true);

create policy "visits_visibility" on visits for select using (
  is_staff() or agent_id = current_agent_id()
  or exists (select 1 from leads l where l.id = lead_id and (is_agency_member(l.agency_id) or is_developer_member(l.developer_id)))
);
create policy "visits_manage" on visits for all using (
  is_staff() or agent_id = current_agent_id()
  or exists (select 1 from leads l where l.id = lead_id and is_agency_member(l.agency_id))
) with check (true);

create policy "conversations_participants" on conversations for select using (
  is_staff() or buyer_id = auth.uid() or agent_id = current_agent_id()
);
create policy "messages_participants" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and (
    is_staff() or c.buyer_id = auth.uid() or c.agent_id = current_agent_id()
  ))
);
create policy "messages_send" on messages for insert with check (sender_id = auth.uid());

-- negocio ------------------------------------------------------------------
create policy "closings_visibility" on closings for select using (
  is_staff() or agent_id = current_agent_id() or is_agency_member(agency_id) or is_developer_member(developer_id)
);
create policy "closings_staff_write" on closings for all using (is_staff()) with check (is_staff());

create policy "commissions_staff_only" on commissions for all using (is_staff()) with check (is_staff());

create policy "verification_requests_visibility" on verification_requests for select using (
  is_staff() or submitted_by = auth.uid()
);
create policy "verification_requests_submit" on verification_requests for insert with check (submitted_by = auth.uid());
create policy "verification_requests_staff" on verification_requests for all using (is_staff()) with check (is_staff());

create policy "moderation_log_staff" on moderation_log for select using (is_staff());
create policy "duplicate_candidates_staff" on duplicate_candidates for all using (is_staff()) with check (is_staff());
create policy "partner_applications_staff" on partner_applications for select using (is_staff());

-- notificaciones ---------------------------------------------------------------
create policy "notifications_own" on notifications for select using (user_id = auth.uid() or is_staff());
create policy "notifications_own_update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- analítica: solo staff puede leer; escritura por service role ---------------
create policy "analytics_events_staff_read" on analytics_events for select using (is_staff());
create policy "property_daily_stats_read" on property_daily_stats for select using (true);
create policy "mortgage_calculations_staff_read" on mortgage_calculations for select using (is_staff());


-- ═══ 0008_storage_and_views.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0008 · Storage buckets + vistas de conveniencia
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Storage: buckets públicos de multimedia ────────────────────────────────
-- Envuelto en un bloque tolerante: si el rol que ejecuta no tiene permisos
-- sobre el schema `storage` (poco común en Supabase) el resto del schema igual
-- se aplica. Las políticas de storage se pueden crear luego desde el dashboard.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('property-media', 'property-media', true, 26214400,
     array['image/jpeg','image/jpg','image/png','image/webp','image/avif','image/gif','image/heic','image/heif']),
    ('project-media', 'project-media', true, 26214400,
     array['image/jpeg','image/jpg','image/png','image/webp','image/avif','image/gif','image/heic','image/heif','application/pdf']),
    ('org-media', 'org-media', true, 5242880,
     array['image/jpeg','image/png','image/webp','image/svg+xml']),
    ('avatars', 'avatars', true, 3145728,
     array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  begin
    execute $p$create policy "ph_public_media_read" on storage.objects for select
      using (bucket_id in ('property-media','project-media','org-media','avatars'))$p$;
  exception when duplicate_object then null; end;

  begin
    execute $p$create policy "ph_media_upload" on storage.objects for insert to authenticated
      with check (bucket_id in ('property-media','project-media','org-media','avatars'))$p$;
  exception when duplicate_object then null; end;

  begin
    execute $p$create policy "ph_media_update" on storage.objects for update to authenticated
      using (owner = auth.uid()) with check (owner = auth.uid())$p$;
  exception when duplicate_object then null; end;

  begin
    execute $p$create policy "ph_media_delete" on storage.objects for delete to authenticated
      using (owner = auth.uid())$p$;
  exception when duplicate_object then null; end;

exception when insufficient_privilege then
  raise notice 'Sin permisos sobre storage.*; configura los buckets desde el dashboard de Supabase.';
end$$;

-- ── Vista: resumen de propiedad para listados (evita N+1 en el cliente) ────
-- `security_invoker` => la vista respeta la RLS de `properties` (anon solo ve PUBLISHED).
create or replace view property_summaries
with (security_invoker = true) as
select
  p.id, p.code, p.slug, p.title,
  p.operation_type, p.property_type, p.condition_status,
  p.price, p.price_on_request, p.currency,
  p.bedrooms, p.bathrooms, p.parking_spaces, p.construction_m2, p.land_m2,
  p.status, p.is_featured, p.is_verified, p.project_id,
  p.latitude, p.longitude, p.hide_exact_location,
  p.published_at, p.last_verified_at, p.created_at,
  p.view_count, p.favorite_count, p.lead_count, p.is_demo,
  sec.name  as sector_name,  sec.slug as sector_slug,
  city.name as city_name,    city.slug as city_slug,
  prov.name as province_name, prov.slug as province_slug,
  ag.id as agency_id, ag.name as agency_name, ag.slug as agency_slug,
  ag.logo_url as agency_logo_url, ag.is_verified as agency_verified,
  agt.id as agent_id, agt.slug as agent_slug, agt.full_name as agent_name,
  agt.avatar_url as agent_avatar_url, agt.is_verified as agent_verified,
  (select count(*) from property_images pi where pi.property_id = p.id) as image_count,
  (select pi.url from property_images pi where pi.property_id = p.id
    order by pi.is_cover desc, pi.position asc limit 1) as cover_url,
  (select pi.blur_data_url from property_images pi where pi.property_id = p.id
    order by pi.is_cover desc, pi.position asc limit 1) as cover_blur
from properties p
left join locations sec  on sec.id = p.sector_id
left join locations city on city.id = p.city_id
left join locations prov on prov.id = p.province_id
left join agencies ag    on ag.id = p.agency_id
left join agents agt      on agt.id = p.agent_id;

comment on view property_summaries is 'Propiedad desnormalizada para cards/listados. Respeta RLS de properties.';

-- ── Vista: agentes con conteo de propiedades activas ──────────────────────
create or replace view agent_directory
with (security_invoker = true) as
select
  a.*,
  ag.name as agency_name, ag.slug as agency_slug,
  (select count(*) from properties p
    where p.agent_id = a.id and p.status = 'PUBLISHED') as active_listings
from agents a
left join agencies ag on ag.id = a.agency_id;

-- ── Vista: agencias con métricas públicas ────────────────────────────────
create or replace view agency_directory
with (security_invoker = true) as
select
  a.*,
  city.name as city_name,
  (select count(*) from properties p where p.agency_id = a.id and p.status = 'PUBLISHED') as active_listings,
  (select count(*) from projects pr where pr.agency_id = a.id and pr.moderation_state = 'PUBLISHED') as project_count,
  (select count(*) from agents ag where ag.agency_id = a.id) as agent_count
from agencies a
left join locations city on city.id = a.city_id;

-- Exponer vistas a los roles de la API de Supabase
grant select on property_summaries, agent_directory, agency_directory to anon, authenticated, service_role;

-- ── Grants explícitos (respaldo de los default privileges de Supabase) ─────
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;


-- ═══ 0009_code_sequences_safe.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0009 · Códigos a prueba de colisiones
--
-- El seed inserta propiedades/proyectos con `code` explícito y NO avanza las
-- secuencias. Sin esto, la primera propiedad publicada por un usuario chocaría
-- con `PH-APT-00001`. Esta migración:
--   1. hace que los triggers de código reintenten hasta encontrar uno libre.
--   2. sincroniza las secuencias con los datos existentes.
-- Idempotente: se puede ejecutar varias veces.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function assign_property_code()
returns trigger language plpgsql as $$
declare
  candidate text;
begin
  if new.code is null or new.code = '' then
    loop
      candidate := 'PH-' || property_type_prefix(new.property_type) || '-' ||
                   lpad(nextval('property_code_seq')::text, 5, '0');
      exit when not exists (select 1 from properties where code = candidate);
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function assign_project_code()
returns trigger language plpgsql as $$
declare
  candidate text;
begin
  if new.code is null or new.code = '' then
    loop
      candidate := 'PH-PRJ-' || lpad(nextval('project_code_seq')::text, 5, '0');
      exit when not exists (select 1 from projects where code = candidate);
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

-- Sincronizar las secuencias con el máximo número usado (por si el seed ya corrió).
select setval(
  'property_code_seq',
  greatest(1, coalesce((select max(nullif(regexp_replace(code, '\D', '', 'g'), '')::int) from properties), 0)),
  true
);
select setval(
  'project_code_seq',
  greatest(1, coalesce((select max(nullif(regexp_replace(code, '\D', '', 'g'), '')::int) from projects), 0)),
  true
);


-- ═══ 0010_fix_contacts_unique.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0010 · Corrige la deduplicación de contactos
--
-- BUG: `contacts_phone_uk` / `contacts_email_uk` eran ÍNDICES ÚNICOS PARCIALES
-- (`where phone is not null`). Postgres NO permite usar un índice único parcial
-- como destino de `ON CONFLICT (phone)` a menos que la cláusula WHERE se repita
-- exacta en el upsert — y `submitLead()` hace justamente
-- `.upsert(contact, { onConflict: "phone" })`. Resultado real, verificado:
--   ERROR: there is no unique or exclusion constraint matching the ON CONFLICT
--   specification
-- Es decir: CADA lead con teléfono fallaba en producción.
--
-- FIX: un índice único simple (no parcial) sobre una columna nullable ya trata
-- cada NULL como distinto (Postgres estándar), así que no hace falta la
-- condición `where ... is not null` para permitir múltiples contactos sin
-- teléfono/correo. Se reemplaza por índices únicos totales, que sí sirven de
-- destino de ON CONFLICT.
-- Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

drop index if exists contacts_phone_uk;
drop index if exists contacts_email_uk;

do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'contacts_phone_key'
  ) then
    create unique index contacts_phone_key on contacts (phone);
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'contacts_email_key'
  ) then
    create unique index contacts_email_key on contacts (email);
  end if;
end$$;


-- ═══ 0011_realtime.sql ═══════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0011 · Realtime para mensajería y notificaciones
--
-- Supabase Realtime solo emite cambios de las tablas incluidas en la
-- publicación `supabase_realtime`. Sin esto, el chat cliente ↔ asesor y la
-- campana de notificaciones dependen únicamente del polling del cliente.
-- Con esto, además del polling, la UI recibe los INSERT al instante.
--
-- La visibilidad de los eventos sigue respetando RLS: un participante solo
-- recibe los mensajes de sus propias conversaciones (`messages_participants`)
-- y cada usuario solo sus notificaciones (`notifications_own`).
-- Idempotente: se puede ejecutar varias veces.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'messages') then
    alter publication supabase_realtime add table messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notifications') then
    alter publication supabase_realtime add table notifications;
  end if;
end $$;
