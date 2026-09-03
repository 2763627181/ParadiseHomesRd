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
