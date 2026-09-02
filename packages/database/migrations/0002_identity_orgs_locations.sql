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
