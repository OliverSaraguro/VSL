-- Ejecuta esto en el SQL Editor de Supabase del proyecto VSL-GRUPO4.
-- Agrega el destino final (ej. el colegio) a cada ruta, sin borrar nada existente.

alter table public.routes
  add column if not exists destination_name text,
  add column if not exists destination_address text,
  add column if not exists destination_latitude double precision,
  add column if not exists destination_longitude double precision;
