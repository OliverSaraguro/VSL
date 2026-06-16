-- Ejecuta esto en el SQL Editor de Supabase del proyecto VSL-GRUPO4.
-- La tabla public.notifications tenía RLS habilitado pero SIN política de INSERT, así que
-- cualquier intento de crear una notificación (abordaje, llegada, desvío, retraso, mensajes,
-- recordatorio de pago, sustituto asignado) fallaba silenciosamente. Esto la agrega.

drop policy if exists "Crear notificaciones propias o como conductor del estudiante" on public.notifications;

create policy "Crear notificaciones propias o como conductor del estudiante"
  on public.notifications for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.students s
      where s.parent_id = notifications.user_id and s.driver_id = auth.uid()
    )
  );
