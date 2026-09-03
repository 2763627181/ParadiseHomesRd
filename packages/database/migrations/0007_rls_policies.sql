-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0007 · Row Level Security
--
-- Modelo:
--  · Contenido público (propiedades/proyectos PUBLISHED, agencias, agentes,
--    ubicaciones) es legible por cualquiera (anon incluido).
--  · Cada usuario ve/gestiona sus propios favoritos, búsquedas y consultas.
--  · Agentes/agencias gestionan su inventario y sus leads.
--  · Staff (ADMIN, SUPER_ADMIN) tiene acceso amplio.
--  · El service role (backend) omite RLS: se usa para escrituras controladas
--    (creación de leads, analítica, moderación).
-- ─────────────────────────────────────────────────────────────────────────────

-- Helpers -------------------------------------------------------------------
-- SECURITY DEFINER + search_path fijo: estas funciones se llaman DENTRO de las
-- políticas RLS, así que NO deben disparar RLS de nuevo (evita recursión infinita
-- en `profiles`). Leen con privilegios del owner y solo devuelven un booleano/id.
create or replace function auth_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select role in ('ADMIN', 'SUPER_ADMIN') from profiles where id = auth.uid()),
    false
  );
$$;

create or replace function is_agency_member(target_agency uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.profile_id = auth.uid()
      and m.agency_id = target_agency
      and m.status = 'active'
  );
$$;

create or replace function is_developer_member(target_developer uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from organization_members m
    where m.profile_id = auth.uid()
      and m.developer_id = target_developer
      and m.status = 'active'
  );
$$;

create or replace function current_agent_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from agents where profile_id = auth.uid();
$$;

-- Helpers para romper la recursión mutua entre las políticas de `contacts` y `leads`.
create or replace function contact_belongs_to_user(c_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from contacts c where c.id = c_id and c.profile_id = auth.uid());
$$;

create or replace function agent_owns_contact(c_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from leads l
    where l.contact_id = c_id
      and (
        l.agent_id = current_agent_id()
        or is_agency_member(l.agency_id)
        or is_developer_member(l.developer_id)
      )
  );
$$;

-- Enable RLS --------------------------------------------------------------------
alter table profiles                enable row level security;
alter table locations               enable row level security;
alter table agencies                enable row level security;
alter table developers              enable row level security;
alter table agents                  enable row level security;
alter table organization_members    enable row level security;
alter table projects                enable row level security;
alter table project_buildings       enable row level security;
alter table project_units           enable row level security;
alter table project_images          enable row level security;
alter table payment_plans           enable row level security;
alter table properties              enable row level security;
alter table property_images         enable row level security;
alter table property_features       enable row level security;
alter table property_amenities      enable row level security;
alter table property_price_history  enable row level security;
alter table favorites               enable row level security;
alter table saved_searches          enable row level security;
alter table recently_viewed         enable row level security;
alter table contacts                enable row level security;
alter table leads                   enable row level security;
alter table lead_activities         enable row level security;
alter table lead_notes              enable row level security;
alter table lead_assignments        enable row level security;
alter table visits                  enable row level security;
alter table conversations           enable row level security;
alter table messages                enable row level security;
alter table closings                enable row level security;
alter table commissions             enable row level security;
alter table verification_requests   enable row level security;
alter table moderation_log          enable row level security;
alter table duplicate_candidates    enable row level security;
alter table partner_applications    enable row level security;
alter table notifications           enable row level security;
alter table analytics_events        enable row level security;
alter table property_daily_stats    enable row level security;
alter table mortgage_calculations   enable row level security;

-- profiles --------------------------------------------------------------------
create policy "profiles_self_select" on profiles for select using (id = auth.uid() or is_staff());
create policy "profiles_self_update" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_staff_all"   on profiles for all using (is_staff()) with check (is_staff());

-- locations (público, escritura solo staff) ----------------------------------
create policy "locations_public_read" on locations for select using (true);
create policy "locations_staff_write" on locations for all using (is_staff()) with check (is_staff());

-- agencies / developers / agents (perfiles públicos) ------------------------
create policy "agencies_public_read" on agencies for select using (true);
create policy "agencies_member_update" on agencies for update
  using (is_agency_member(id) or is_staff()) with check (is_agency_member(id) or is_staff());
create policy "agencies_staff_write" on agencies for all using (is_staff()) with check (is_staff());

create policy "developers_public_read" on developers for select using (true);
create policy "developers_member_update" on developers for update
  using (is_developer_member(id) or is_staff()) with check (is_developer_member(id) or is_staff());
create policy "developers_staff_write" on developers for all using (is_staff()) with check (is_staff());

create policy "agents_public_read" on agents for select using (true);
create policy "agents_self_update" on agents for update
  using (profile_id = auth.uid() or is_staff()) with check (profile_id = auth.uid() or is_staff());
create policy "agents_staff_write" on agents for all using (is_staff()) with check (is_staff());

create policy "org_members_visible" on organization_members for select
  using (profile_id = auth.uid() or is_agency_member(agency_id) or is_developer_member(developer_id) or is_staff());
create policy "org_members_manage" on organization_members for all
  using (is_staff() or is_agency_member(agency_id) or is_developer_member(developer_id))
  with check (is_staff() or is_agency_member(agency_id) or is_developer_member(developer_id));

-- projects & children -------------------------------------------------------
create policy "projects_public_read" on projects for select
  using (moderation_state = 'PUBLISHED' or is_staff()
         or is_developer_member(developer_id) or is_agency_member(agency_id));
create policy "projects_owner_write" on projects for all
  using (is_staff() or is_developer_member(developer_id) or is_agency_member(agency_id))
  with check (is_staff() or is_developer_member(developer_id) or is_agency_member(agency_id));

create policy "project_children_read" on project_buildings for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "project_children_write" on project_buildings for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));

create policy "project_units_read" on project_units for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "project_units_write" on project_units for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));

create policy "project_images_read" on project_images for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "project_images_write" on project_images for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (true);

create policy "payment_plans_read" on payment_plans for select
  using (exists (select 1 from projects p where p.id = project_id
                 and (p.moderation_state = 'PUBLISHED' or is_staff()
                      or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))));
create policy "payment_plans_write" on payment_plans for all
  using (exists (select 1 from projects p where p.id = project_id
                 and (is_staff() or is_developer_member(p.developer_id) or is_agency_member(p.agency_id))))
  with check (true);

-- properties & children ---------------------------------------------------
create policy "properties_public_read" on properties for select
  using (
    status = 'PUBLISHED'
    or is_staff()
    or owner_profile_id = auth.uid()
    or agent_id = current_agent_id()
    or is_agency_member(agency_id)
    or is_developer_member(developer_id)
  );
create policy "properties_owner_write" on properties for all
  using (
    is_staff()
    or owner_profile_id = auth.uid()
    or agent_id = current_agent_id()
    or is_agency_member(agency_id)
    or is_developer_member(developer_id)
  )
  with check (
    is_staff()
    or owner_profile_id = auth.uid()
    or agent_id = current_agent_id()
    or is_agency_member(agency_id)
    or is_developer_member(developer_id)
  );

create policy "property_images_read" on property_images for select
  using (exists (select 1 from properties p where p.id = property_id
                 and (p.status = 'PUBLISHED' or is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))));
create policy "property_images_write" on property_images for all
  using (exists (select 1 from properties p where p.id = property_id
                 and (is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))))
  with check (true);

create policy "property_features_read" on property_features for select using (true);
create policy "property_features_write" on property_features for all
  using (exists (select 1 from properties p where p.id = property_id
                 and (is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))))
  with check (true);

create policy "property_amenities_read" on property_amenities for select using (true);
create policy "property_amenities_write" on property_amenities for all
  using (exists (select 1 from properties p where p.id = property_id
                 and (is_staff() or p.owner_profile_id = auth.uid()
                      or p.agent_id = current_agent_id() or is_agency_member(p.agency_id))))
  with check (true);

create policy "price_history_read" on property_price_history for select using (true);

-- favorites / saved searches / recently viewed --------------------------------
create policy "favorites_own" on favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "saved_searches_own" on saved_searches for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recently_viewed_own" on recently_viewed for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- contacts / leads / CRM -----------------------------------------------------
-- El contacto es visible para el dueño (si tiene profile), el agente/agencia
-- del lead asociado, y staff.
create policy "contacts_visibility" on contacts for select using (
  profile_id = auth.uid()
  or is_staff()
  or agent_owns_contact(id)
);

create policy "leads_visibility" on leads for select using (
  is_staff()
  or agent_id = current_agent_id()
  or is_agency_member(agency_id)
  or is_developer_member(developer_id)
  or contact_belongs_to_user(contact_id)
);
create policy "leads_agent_agency_update" on leads for update using (
  is_staff() or agent_id = current_agent_id() or is_agency_member(agency_id) or is_developer_member(developer_id)
) with check (
  is_staff() or agent_id = current_agent_id() or is_agency_member(agency_id) or is_developer_member(developer_id)
);

create policy "lead_children_visibility" on lead_activities for select using (
  exists (select 1 from leads l where l.id = lead_id and (
    is_staff() or l.agent_id = current_agent_id() or is_agency_member(l.agency_id) or is_developer_member(l.developer_id)
  ))
);
create policy "lead_notes_rw" on lead_notes for all using (
  exists (select 1 from leads l where l.id = lead_id and (
    is_staff() or l.agent_id = current_agent_id() or is_agency_member(l.agency_id)
  ))
) with check (author_id = auth.uid());
create policy "lead_assignments_visibility" on lead_assignments for select using (
  exists (select 1 from leads l where l.id = lead_id and (
    is_staff() or l.agent_id = current_agent_id() or is_agency_member(l.agency_id)
  ))
);
create policy "lead_assignments_manage" on lead_assignments for all using (
  is_staff() or exists (select 1 from leads l where l.id = lead_id and is_agency_member(l.agency_id))
) with check (true);

create policy "visits_visibility" on visits for select using (
  is_staff() or agent_id = current_agent_id()
  or exists (select 1 from leads l where l.id = lead_id and (is_agency_member(l.agency_id) or is_developer_member(l.developer_id)))
);
create policy "visits_manage" on visits for all using (
  is_staff() or agent_id = current_agent_id()
  or exists (select 1 from leads l where l.id = lead_id and is_agency_member(l.agency_id))
) with check (true);

create policy "conversations_participants" on conversations for select using (
  is_staff() or buyer_id = auth.uid() or agent_id = current_agent_id()
);
create policy "messages_participants" on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and (
    is_staff() or c.buyer_id = auth.uid() or c.agent_id = current_agent_id()
  ))
);
create policy "messages_send" on messages for insert with check (sender_id = auth.uid());

-- negocio ------------------------------------------------------------------
create policy "closings_visibility" on closings for select using (
  is_staff() or agent_id = current_agent_id() or is_agency_member(agency_id) or is_developer_member(developer_id)
);
create policy "closings_staff_write" on closings for all using (is_staff()) with check (is_staff());

create policy "commissions_staff_only" on commissions for all using (is_staff()) with check (is_staff());

create policy "verification_requests_visibility" on verification_requests for select using (
  is_staff() or submitted_by = auth.uid()
);
create policy "verification_requests_submit" on verification_requests for insert with check (submitted_by = auth.uid());
create policy "verification_requests_staff" on verification_requests for all using (is_staff()) with check (is_staff());

create policy "moderation_log_staff" on moderation_log for select using (is_staff());
create policy "duplicate_candidates_staff" on duplicate_candidates for all using (is_staff()) with check (is_staff());
create policy "partner_applications_staff" on partner_applications for select using (is_staff());

-- notificaciones ---------------------------------------------------------------
create policy "notifications_own" on notifications for select using (user_id = auth.uid() or is_staff());
create policy "notifications_own_update" on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- analítica: solo staff puede leer; escritura por service role ---------------
create policy "analytics_events_staff_read" on analytics_events for select using (is_staff());
create policy "property_daily_stats_read" on property_daily_stats for select using (true);
create policy "mortgage_calculations_staff_read" on mortgage_calculations for select using (is_staff());
