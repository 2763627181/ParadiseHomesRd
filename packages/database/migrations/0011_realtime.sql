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
