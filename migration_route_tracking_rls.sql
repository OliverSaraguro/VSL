-- =========================================================================
-- HU29: "Tener la certeza de que solo yo y los demás padres de la ruta podemos ver la
-- ubicación de la buseta".
--
-- Hueco encontrado en la auditoría del backlog: las políticas de lectura de `routes`, `stops`,
-- `trips` y `boardings` usaban `auth.role() = 'authenticated'`, es decir, CUALQUIER usuario
-- logueado (de cualquier ruta, de cualquier conductor) podía leer la ubicación de las casas de
-- los estudiantes, el estado de cualquier viaje y los abordajes de cualquier niño. Además, el
-- canal de Supabase Realtime usado para transmitir el GPS en vivo (`trip:<tripId>`) no tenía
-- autorización: cualquier cliente que conociera o adivinara el tripId podía suscribirse a la
-- transmisión de ubicación sin pasar por RLS.
--
-- Este script reemplaza esas políticas por reglas que solo permiten leer si el usuario es:
--   a) el conductor (o sustituto) dueño de la ruta/viaje, o
--   b) el padre de un estudiante que tiene una parada en esa ruta (esto sigue permitiendo que
--      "los demás padres de la ruta" vean el mapa completo, como pide la propia historia).
--
-- Y habilita "Realtime Authorization" (canales privados) para que el broadcast de GPS también
-- respete esa misma regla a nivel de transporte, no solo a nivel de tabla.
-- =========================================================================

-- ─── routes ──────────────────────────────────────────────────────────────────
drop policy if exists "Lectura de rutas" on public.routes;
create policy "Lectura de rutas" on public.routes for select using (
  auth.uid() = driver_id
  or exists (
    select 1
    from public.stops st
    join public.students s on s.id = st.student_id
    where st.route_id = routes.id and s.parent_id = auth.uid()
  )
);

-- ─── stops ───────────────────────────────────────────────────────────────────
drop policy if exists "Lectura de paradas" on public.stops;
create policy "Lectura de paradas" on public.stops for select using (
  exists (select 1 from public.routes r where r.id = stops.route_id and r.driver_id = auth.uid())
  or exists (
    select 1
    from public.stops st
    join public.students s on s.id = st.student_id
    where st.route_id = stops.route_id and s.parent_id = auth.uid()
  )
);

-- ─── trips ───────────────────────────────────────────────────────────────────
drop policy if exists "Lectura de viajes" on public.trips;
create policy "Lectura de viajes" on public.trips for select using (
  auth.uid() = driver_id
  or auth.uid() = substitute_driver_id
  or exists (
    select 1
    from public.stops st
    join public.students s on s.id = st.student_id
    where st.route_id = trips.route_id and s.parent_id = auth.uid()
  )
);

-- ─── boardings ───────────────────────────────────────────────────────────────
drop policy if exists "Lectura de abordajes" on public.boardings;
create policy "Lectura de abordajes" on public.boardings for select using (
  exists (
    select 1 from public.trips t
    where t.id = boardings.trip_id
    and (t.driver_id = auth.uid() or t.substitute_driver_id = auth.uid())
  )
  or exists (
    select 1 from public.students s
    where s.id = boardings.student_id and s.parent_id = auth.uid()
  )
);

-- =========================================================================
-- Realtime Authorization para el canal `trip:<tripId>` (broadcast de GPS en vivo).
-- Requiere que el cliente abra el canal con `config: { private: true }`
-- (ver mobile/src/servicios/tracking.service.ts) — sin eso, estas políticas no se aplican.
-- =========================================================================
alter table realtime.messages enable row level security;

drop policy if exists "Suscribirse al tracking de un viaje propio" on realtime.messages;
create policy "Suscribirse al tracking de un viaje propio"
on realtime.messages for select
to authenticated
using (
  exists (
    select 1
    from public.trips t
    where 'trip:' || t.id::text = realtime.messages.topic
    and (
      t.driver_id = auth.uid()
      or t.substitute_driver_id = auth.uid()
      or exists (
        select 1
        from public.stops st
        join public.students s on s.id = st.student_id
        where st.route_id = t.route_id and s.parent_id = auth.uid()
      )
    )
  )
);

drop policy if exists "Solo el conductor transmite ubicacion de su viaje" on realtime.messages;
create policy "Solo el conductor transmite ubicacion de su viaje"
on realtime.messages for insert
to authenticated
with check (
  exists (
    select 1 from public.trips t
    where 'trip:' || t.id::text = realtime.messages.topic
    and (t.driver_id = auth.uid() or t.substitute_driver_id = auth.uid())
  )
);
