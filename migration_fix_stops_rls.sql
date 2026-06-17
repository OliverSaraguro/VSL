-- =========================================================================
-- Fix: recursión infinita en las políticas RLS de la tabla `stops`
--
-- Problema encontrado tras aplicar migration_route_tracking_rls.sql:
--
--   1. La política SELECT de `stops` referenciaba `public.routes`, pero la
--      política SELECT de `routes` (también del mismo migration) referencia
--      `public.stops` → recursión mutua routes↔stops.
--
--   2. La misma política SELECT de `stops` también se referenciaba a sí misma
--      (alias `st`) en la segunda condición → recursión directa.
--
--   3. La política ALL de `stops` ("Gestión de paradas") también referenciaba
--      `public.routes`, lo que produce el mismo loop durante INSERT/UPDATE/DELETE
--      (y también durante SELECT, porque FOR ALL aplica a todos los comandos).
--
-- Solución: reescribir ambas políticas de `stops` para que consulten
-- `public.students` directamente. La política de students solo comprueba
-- columnas de la propia fila (driver_id, parent_id), sin referencias a otras
-- tablas → ningún ciclo posible.
--
-- Semántica conservada:
--   - SELECT: el conductor ve las paradas de sus estudiantes; el padre ve las
--             paradas de sus hijos.
--   - ALL:    el conductor solo puede crear/modificar/borrar paradas cuyos
--             estudiantes le pertenecen (equivalente al check anterior vía routes,
--             ya que un estudiante siempre pertenece a la ruta del conductor).
-- =========================================================================

-- ─── stops: política SELECT ───────────────────────────────────────────────────
drop policy if exists "Lectura de paradas" on public.stops;
create policy "Lectura de paradas" on public.stops for select using (
  exists (
    select 1 from public.students s
    where s.id = stops.student_id
      and (s.driver_id = auth.uid() or s.parent_id = auth.uid())
  )
);

-- ─── stops: política ALL (conductores) ───────────────────────────────────────
drop policy if exists "Gestión de paradas (conductores)" on public.stops;
create policy "Gestión de paradas (conductores)" on public.stops for all using (
  exists (
    select 1 from public.students s
    where s.id = stops.student_id
      and s.driver_id = auth.uid()
  )
);
