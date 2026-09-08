-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0013 · Blog y guías
--
-- Contenido editorial administrado desde /admin/content y mostrado en
-- /blog y /blog/[slug]. Cuerpo en Markdown. Solo staff escribe; el público
-- lee los PUBLISHED.
-- Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

do $$ begin
  if not exists (select 1 from pg_type where typname = 'blog_status') then
    create type blog_status as enum ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  end if;
end $$;

create table if not exists blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  body            text not null default '',
  cover_image_url text,
  category        text,
  tags            text[] not null default '{}',
  author_id       uuid references profiles (id) on delete set null,
  author_name     text not null default 'Equipo Paradise',
  read_minutes    integer,
  status          blog_status not null default 'DRAFT',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists blog_posts_status_idx on blog_posts (status, published_at desc);
create index if not exists blog_posts_category_idx on blog_posts (category) where category is not null;

alter table blog_posts enable row level security;

drop policy if exists "blog_posts_public_read" on blog_posts;
create policy "blog_posts_public_read" on blog_posts for select
  using (status = 'PUBLISHED' or is_staff());

drop policy if exists "blog_posts_staff" on blog_posts;
create policy "blog_posts_staff" on blog_posts for all
  using (is_staff()) with check (is_staff());
