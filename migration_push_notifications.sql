-- =========================================================================
-- HU09 (+ push real para HU14/HU15/HU16/HU24/HU05/HU26, etc.)
--
-- Hasta ahora `notifications.service.ts` solo INSERTABA filas en `public.notifications`; el
-- padre las veía recién cuando abría la app (no es un push real con la app cerrada). Y no había
-- ningún mecanismo que detectara "el bus está a 5 minutos" — el ETA solo se calculaba y mostraba
-- en pantalla del lado del padre (TrackingScreen), nunca se evaluaba en el servidor.
--
-- Este script agrega:
--   1. Una columna de push token en `public.users` (hoy no se guardaba en ningún lado consultable
--      desde SQL: registerPushToken() lo escribía en metadata de auth.users y nunca se llamaba).
--   2. `public.trip_locations`: un registro liviano de cada ping GPS del conductor (hoy el GPS
--      solo se transmitía por Realtime broadcast, efímero, sin persistir nada en la base).
--   3. Un trigger que, en cada ping, calcula la distancia/ETA a la siguiente parada pendiente y,
--      si es ≤ 5 min, crea la notificación de "buseta cerca" (con deduplicación, una sola vez
--      por parada/viaje — igual patrón que ya usa el recordatorio de pagos).
--   4. Un trigger GENÉRICO en `public.notifications`: cada vez que se inserta una notificación
--      (de cualquier tipo, no solo la de ETA) y el destinatario tiene push token guardado, llama
--      a una Edge Function que reenvía el push a la Expo Push API. Así HU09, HU14, HU15, HU16,
--      HU24, HU05, HU26... todas pasan a entregarse como push real, no solo in-app.
--
-- ⚠️ ESTE ARCHIVO POR SÍ SOLO NO ACTIVA NADA. Pasos manuales pendientes (ver mensaje de resumen):
--    a) Desplegar la Edge Function de supabase/functions/send-push/ (`supabase functions deploy send-push`).
--    b) Configurar `app.settings.push_function_url` y `app.settings.push_function_secret` (abajo).
--    c) Generar un development build de la app (Expo Go NO soporta push remoto real).
-- =========================================================================

-- ─── 1. Push token por usuario ────────────────────────────────────────────────
alter table public.users add column if not exists push_token text;
alter table public.users add column if not exists push_token_platform text;

-- ─── 2. Registro de pings GPS (liviano, solo lo necesario para calcular ETA) ──
create table if not exists public.trip_locations (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz default now() not null
);
create index if not exists trip_locations_trip_id_idx on public.trip_locations (trip_id, created_at desc);

alter table public.trip_locations enable row level security;

drop policy if exists "Conductor registra su propio GPS" on public.trip_locations;
create policy "Conductor registra su propio GPS" on public.trip_locations for insert with check (
  exists (
    select 1 from public.trips t
    where t.id = trip_locations.trip_id
    and (t.driver_id = auth.uid() or t.substitute_driver_id = auth.uid())
  )
);

drop policy if exists "Lectura de pings GPS de viajes propios" on public.trip_locations;
create policy "Lectura de pings GPS de viajes propios" on public.trip_locations for select using (
  exists (
    select 1 from public.trips t
    where t.id = trip_locations.trip_id
    and (
      t.driver_id = auth.uid()
      or t.substitute_driver_id = auth.uid()
      or exists (
        select 1 from public.stops st
        join public.students s on s.id = st.student_id
        where st.route_id = t.route_id and s.parent_id = auth.uid()
      )
    )
  )
);

-- ─── 3. Detección de "buseta a ≤5 min" (HU09) ─────────────────────────────────
create or replace function public.haversine_meters(
  lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision
) returns double precision language sql immutable as $$
  select 2 * 6371000 * asin(sqrt(
    sin(radians(lat2 - lat1) / 2) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians(lon2 - lon1) / 2) ^ 2
  ));
$$;

create or replace function public.handle_trip_location_eta() returns trigger
language plpgsql security definer as $$
declare
  v_route_id uuid;
  v_next record;
  v_distance double precision;
  v_eta_minutes double precision;
  v_parent_id uuid;
  v_student_name text;
  v_already_notified boolean;
begin
  select route_id into v_route_id from public.trips where id = new.trip_id;
  if v_route_id is null then
    return new;
  end if;

  -- Siguiente parada pendiente (sin abordaje todavía en este viaje), en orden.
  select st.id, st.address, st.latitude, st.longitude, st.student_id
    into v_next
  from public.stops st
  where st.route_id = v_route_id
    and not exists (
      select 1 from public.boardings b
      where b.trip_id = new.trip_id and b.student_id = st.student_id
    )
  order by st."order" asc
  limit 1;

  if v_next.id is null then
    return new;
  end if;

  v_distance := public.haversine_meters(new.latitude, new.longitude, v_next.latitude, v_next.longitude);
  -- Misma estimación de velocidad promedio urbana que usa el cliente (25 km/h).
  v_eta_minutes := (v_distance / 1000.0 / 25.0) * 60.0;

  if v_eta_minutes > 5 then
    return new;
  end if;

  select parent_id, name into v_parent_id, v_student_name
  from public.students where id = v_next.student_id;

  if v_parent_id is null then
    return new;
  end if;

  select exists (
    select 1 from public.notifications
    where user_id = v_parent_id
      and type = 'eta_5min'
      and data->>'tripId' = new.trip_id::text
      and data->>'stopId' = v_next.id::text
  ) into v_already_notified;

  if not v_already_notified then
    insert into public.notifications (user_id, title, body, type, data)
    values (
      v_parent_id,
      'La buseta está cerca',
      format('La buseta llega en aproximadamente 5 min a "%s".', v_next.address),
      'eta_5min',
      jsonb_build_object('tripId', new.trip_id, 'stopId', v_next.id, 'studentName', v_student_name)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trip_locations_eta_check on public.trip_locations;
create trigger trip_locations_eta_check
  after insert on public.trip_locations
  for each row execute function public.handle_trip_location_eta();

-- ─── 4. Push real (fan-out genérico) cuando se crea CUALQUIER notificación ────
-- Requiere la extensión pg_net (incluida por defecto en proyectos Supabase) y la Edge Function
-- "send-push" desplegada. La URL/secreto se leen de configuración de Postgres — ver checklist.
create extension if not exists pg_net;

create or replace function public.handle_notification_push() returns trigger
language plpgsql security definer as $$
declare
  v_push_token text;
  v_function_url text;
  v_function_secret text;
begin
  select push_token into v_push_token from public.users where id = new.user_id;
  if v_push_token is null or v_push_token = '' then
    return new; -- el usuario no tiene token registrado (sin permiso, o sin development build)
  end if;

  v_function_url := current_setting('app.settings.push_function_url', true);
  v_function_secret := current_setting('app.settings.push_function_secret', true);
  if v_function_url is null or v_function_url = '' then
    return new; -- todavía no se configuró la Edge Function (ver checklist de despliegue)
  end if;

  perform net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(v_function_secret, '')
    ),
    body := jsonb_build_object(
      'pushToken', v_push_token,
      'title', new.title,
      'body', new.body,
      'data', coalesce(new.data, '{}'::jsonb)
    )
  );

  return new;
end;
$$;

drop trigger if exists notifications_push_fanout on public.notifications;
create trigger notifications_push_fanout
  after insert on public.notifications
  for each row execute function public.handle_notification_push();
