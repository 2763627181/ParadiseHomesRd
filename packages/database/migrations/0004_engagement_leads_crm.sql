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
