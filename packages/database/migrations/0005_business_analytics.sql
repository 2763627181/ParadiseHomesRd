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
