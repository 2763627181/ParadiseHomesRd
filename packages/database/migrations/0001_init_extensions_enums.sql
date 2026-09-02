-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0001 · Extensiones y tipos ENUM
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";       -- gen_random_uuid()
create extension if not exists "pg_trgm";         -- búsqueda por similitud
create extension if not exists "unaccent";        -- normalización de acentos
create extension if not exists "citext";          -- emails case-insensitive
create extension if not exists "cube";
create extension if not exists "earthdistance";   -- distancia geográfica (fase 1)

-- Config de búsqueda en español que ignora acentos
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'es_unaccent') then
    create text search configuration es_unaccent (copy = spanish);
    alter text search configuration es_unaccent
      alter mapping for hword, hword_part, word with unaccent, spanish_stem;
  end if;
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
