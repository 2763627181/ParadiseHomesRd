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
