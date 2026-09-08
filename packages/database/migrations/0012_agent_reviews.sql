-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0012 · Reseñas de asesores
--
-- Un comprador/inquilino deja una calificación (1–5) + comentario sobre un
-- asesor con el que trabajó. Un trigger recalcula `agents.rating_average` y
-- `agents.rating_count` a partir de las reseñas PUBLISHED.
-- Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_type where typname = 'review_status') then
    create type review_status as enum ('PENDING', 'PUBLISHED', 'REJECTED');
  end if;
end $$;

create table if not exists agent_reviews (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references agents (id) on delete cascade,
  author_id    uuid references profiles (id) on delete set null,
  author_name  text not null,
  lead_id      uuid references leads (id) on delete set null,
  closing_id   uuid references closings (id) on delete set null,
  rating       smallint not null check (rating between 1 and 5),
  title        text,
  body         text not null,
  status       review_status not null default 'PUBLISHED',
  is_demo      boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists agent_reviews_agent_idx on agent_reviews (agent_id, created_at desc);
create unique index if not exists agent_reviews_one_per_author
  on agent_reviews (agent_id, author_id) where author_id is not null;

create or replace function recompute_agent_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare aid uuid;
begin
  aid := coalesce(new.agent_id, old.agent_id);
  update agents a set
    rating_count = (
      select count(*) from agent_reviews r where r.agent_id = aid and r.status = 'PUBLISHED'
    ),
    rating_average = (
      select round(avg(r.rating)::numeric, 1)
      from agent_reviews r where r.agent_id = aid and r.status = 'PUBLISHED'
    )
  where a.id = aid;
  return null;
end $$;

drop trigger if exists trg_agent_reviews_rating on agent_reviews;
create trigger trg_agent_reviews_rating
  after insert or update or delete on agent_reviews
  for each row execute function recompute_agent_rating();

alter table agent_reviews enable row level security;

drop policy if exists "agent_reviews_read" on agent_reviews;
create policy "agent_reviews_read" on agent_reviews for select
  using (status = 'PUBLISHED' or author_id = auth.uid() or is_staff());

drop policy if exists "agent_reviews_insert_own" on agent_reviews;
create policy "agent_reviews_insert_own" on agent_reviews for insert
  with check (author_id = auth.uid());

drop policy if exists "agent_reviews_update_own" on agent_reviews;
create policy "agent_reviews_update_own" on agent_reviews for update
  using (author_id = auth.uid() or is_staff()) with check (author_id = auth.uid() or is_staff());

drop policy if exists "agent_reviews_staff" on agent_reviews;
create policy "agent_reviews_staff" on agent_reviews for all
  using (is_staff()) with check (is_staff());
