-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0015 · Asesor asignado a un proyecto
--
-- `projects` tenía `developer_id` y `agency_id` pero ningún `agent_id` — a
-- diferencia de `properties`, que sí permite asignar un asesor específico.
-- Sin esto no había forma de decir "este proyecto lo lleva tal asesor",
-- solo "lo lleva tal inmobiliaria".
-- ─────────────────────────────────────────────────────────────────────────────

alter table projects add column if not exists agent_id uuid references agents (id) on delete set null;
create index if not exists projects_agent_idx on projects (agent_id);
