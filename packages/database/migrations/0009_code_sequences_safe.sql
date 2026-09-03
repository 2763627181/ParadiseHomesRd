-- ─────────────────────────────────────────────────────────────────────────────
-- Paradise Homes RD — 0009 · Códigos a prueba de colisiones
--
-- El seed inserta propiedades/proyectos con `code` explícito y NO avanza las
-- secuencias. Sin esto, la primera propiedad publicada por un usuario chocaría
-- con `PH-APT-00001`. Esta migración:
--   1. hace que los triggers de código reintenten hasta encontrar uno libre.
--   2. sincroniza las secuencias con los datos existentes.
-- Idempotente: se puede ejecutar varias veces.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function assign_property_code()
returns trigger language plpgsql as $$
declare
  candidate text;
begin
  if new.code is null or new.code = '' then
    loop
      candidate := 'PH-' || property_type_prefix(new.property_type) || '-' ||
                   lpad(nextval('property_code_seq')::text, 5, '0');
      exit when not exists (select 1 from properties where code = candidate);
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

create or replace function assign_project_code()
returns trigger language plpgsql as $$
declare
  candidate text;
begin
  if new.code is null or new.code = '' then
    loop
      candidate := 'PH-PRJ-' || lpad(nextval('project_code_seq')::text, 5, '0');
      exit when not exists (select 1 from projects where code = candidate);
    end loop;
    new.code := candidate;
  end if;
  return new;
end;
$$;

-- Sincronizar las secuencias con el máximo número usado (por si el seed ya corrió).
select setval(
  'property_code_seq',
  greatest(1, coalesce((select max(nullif(regexp_replace(code, '\D', '', 'g'), '')::int) from properties), 0)),
  true
);
select setval(
  'project_code_seq',
  greatest(1, coalesce((select max(nullif(regexp_replace(code, '\D', '', 'g'), '')::int) from projects), 0)),
  true
);
