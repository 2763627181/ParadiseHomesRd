-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0008 · Storage buckets + vistas de conveniencia
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Storage: buckets públicos de multimedia ────────────────────────────────
-- Envuelto en un bloque tolerante: si el rol que ejecuta no tiene permisos
-- sobre el schema `storage` (poco común en Supabase) el resto del schema igual
-- se aplica. Las políticas de storage se pueden crear luego desde el dashboard.
do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values
    ('property-media', 'property-media', true, 26214400,
     array['image/jpeg','image/jpg','image/png','image/webp','image/avif','image/gif','image/heic','image/heif']),
    ('project-media', 'project-media', true, 26214400,
     array['image/jpeg','image/jpg','image/png','image/webp','image/avif','image/gif','image/heic','image/heif','application/pdf']),
    ('org-media', 'org-media', true, 5242880,
     array['image/jpeg','image/png','image/webp','image/svg+xml']),
    ('avatars', 'avatars', true, 3145728,
     array['image/jpeg','image/png','image/webp'])
  on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

  begin
    execute $p$create policy "ph_public_media_read" on storage.objects for select
      using (bucket_id in ('property-media','project-media','org-media','avatars'))$p$;
  exception when duplicate_object then null; end;

  begin
    execute $p$create policy "ph_media_upload" on storage.objects for insert to authenticated
      with check (bucket_id in ('property-media','project-media','org-media','avatars'))$p$;
  exception when duplicate_object then null; end;

  begin
    execute $p$create policy "ph_media_update" on storage.objects for update to authenticated
      using (owner = auth.uid()) with check (owner = auth.uid())$p$;
  exception when duplicate_object then null; end;

  begin
    execute $p$create policy "ph_media_delete" on storage.objects for delete to authenticated
      using (owner = auth.uid())$p$;
  exception when duplicate_object then null; end;

exception when insufficient_privilege then
  raise notice 'Sin permisos sobre storage.*; configura los buckets desde el dashboard de Supabase.';
end$$;

-- ── Vista: resumen de propiedad para listados (evita N+1 en el cliente) ────
-- `security_invoker` => la vista respeta la RLS de `properties` (anon solo ve PUBLISHED).
create or replace view property_summaries
with (security_invoker = true) as
select
  p.id, p.code, p.slug, p.title,
  p.operation_type, p.property_type, p.condition_status,
  p.price, p.price_on_request, p.currency,
  p.bedrooms, p.bathrooms, p.parking_spaces, p.construction_m2, p.land_m2,
  p.status, p.is_featured, p.is_verified, p.project_id,
  p.latitude, p.longitude, p.hide_exact_location,
  p.published_at, p.last_verified_at, p.created_at,
  p.view_count, p.favorite_count, p.lead_count, p.is_demo,
  sec.name  as sector_name,  sec.slug as sector_slug,
  city.name as city_name,    city.slug as city_slug,
  prov.name as province_name, prov.slug as province_slug,
  ag.id as agency_id, ag.name as agency_name, ag.slug as agency_slug,
  ag.logo_url as agency_logo_url, ag.is_verified as agency_verified,
  agt.id as agent_id, agt.slug as agent_slug, agt.full_name as agent_name,
  agt.avatar_url as agent_avatar_url, agt.is_verified as agent_verified,
  (select count(*) from property_images pi where pi.property_id = p.id) as image_count,
  (select pi.url from property_images pi where pi.property_id = p.id
    order by pi.is_cover desc, pi.position asc limit 1) as cover_url,
  (select pi.blur_data_url from property_images pi where pi.property_id = p.id
    order by pi.is_cover desc, pi.position asc limit 1) as cover_blur
from properties p
left join locations sec  on sec.id = p.sector_id
left join locations city on city.id = p.city_id
left join locations prov on prov.id = p.province_id
left join agencies ag    on ag.id = p.agency_id
left join agents agt      on agt.id = p.agent_id;

comment on view property_summaries is 'Propiedad desnormalizada para cards/listados. Respeta RLS de properties.';

-- ── Vista: agentes con conteo de propiedades activas ──────────────────────
create or replace view agent_directory
with (security_invoker = true) as
select
  a.*,
  ag.name as agency_name, ag.slug as agency_slug,
  (select count(*) from properties p
    where p.agent_id = a.id and p.status = 'PUBLISHED') as active_listings
from agents a
left join agencies ag on ag.id = a.agency_id;

-- ── Vista: agencias con métricas públicas ────────────────────────────────
create or replace view agency_directory
with (security_invoker = true) as
select
  a.*,
  city.name as city_name,
  (select count(*) from properties p where p.agency_id = a.id and p.status = 'PUBLISHED') as active_listings,
  (select count(*) from projects pr where pr.agency_id = a.id and pr.moderation_state = 'PUBLISHED') as project_count,
  (select count(*) from agents ag where ag.agency_id = a.id) as agent_count
from agencies a
left join locations city on city.id = a.city_id;

-- Exponer vistas a los roles de la API de Supabase
grant select on property_summaries, agent_directory, agency_directory to anon, authenticated, service_role;

-- ── Grants explícitos (respaldo de los default privileges de Supabase) ─────
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
