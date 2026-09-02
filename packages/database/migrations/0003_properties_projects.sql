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
