-- =========================================================================
-- VSL - Vehículos Seguros Loja
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- =========================================================================

-- 1. TIPOS PERSONALIZADOS (ENUMS)
create type public.user_role as enum ('DRIVER', 'PARENT');
create type public.trip_status as enum ('scheduled', 'in_progress', 'paused', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'overdue', 'cancelled');

-- 2. TABLAS DE DOMINIO PÚBLICO

-- Perfil general de usuario (Sincronizado con auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  name text not null,
  phone text,
  role public.user_role not null,
  photo_url text,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Datos específicos del conductor
create table public.drivers (
  id uuid references public.users(id) on delete cascade primary key,
  license_number text not null unique,
  plate_number text not null unique,
  vehicle_model text not null,
  vehicle_color text not null,
  license_expiry date,
  vehicle_brand text,
  vehicle_year integer,
  vehicle_capacity integer,
  rating numeric(3,2) default 5.00 not null,
  total_trips integer default 0 not null,
  is_verified boolean default false not null
);

-- Datos específicos del padre de familia
create table public.parents (
  id uuid references public.users(id) on delete cascade primary key,
  invitation_code text not null unique
);

-- Estudiantes
create table public.students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  photo_url text,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_active boolean default true not null,
  driver_id uuid references public.drivers(id) not null,
  parent_id uuid references public.parents(id) on delete set null,
  created_at timestamptz default now() not null
);

-- Rutas
create table public.routes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  is_active boolean default true not null,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  destination_name text,
  destination_address text,
  destination_latitude double precision,
  destination_longitude double precision,
  created_at timestamptz default now() not null
);

-- Paradas de la ruta (Ordenadas y asociadas a un estudiante)
create table public.stops (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  "order" integer not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  estimated_time text not null,
  unique (route_id, "order")
);

-- Viajes / Recorridos activos o completados
create table public.trips (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  substitute_driver_id uuid references public.drivers(id) on delete set null,
  status public.trip_status default 'scheduled'::public.trip_status not null,
  started_at timestamptz default now() not null,
  finished_at timestamptz
);

-- Abordajes reales durante un recorrido
create table public.boardings (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  boarded_at timestamptz default now() not null,
  latitude double precision not null,
  longitude double precision not null,
  unique (trip_id, student_id)
);

-- Ausencias reportadas por el padre
create table public.absences (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  registered_by uuid references public.parents(id) on delete cascade not null,
  date date not null,
  reason text,
  created_at timestamptz default now() not null,
  unique (student_id, date)
);

-- Pagos mensuales por estudiante
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  month integer not null,
  year integer not null,
  amount double precision not null,
  status public.payment_status default 'pending'::public.payment_status not null,
  paid_at timestamptz,
  due_date date not null,
  unique (student_id, driver_id, month, year)
);

-- Notificaciones push históricas
create table public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  body text not null,
  type text not null,
  is_read boolean default false not null,
  data jsonb,
  created_at timestamptz default now() not null
);

-- Alertas de tráfico
create table public.traffic_alerts (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null
);

-- Delegación de conductores sustitutos
create table public.driver_substitutions (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  titular_driver_id uuid references public.drivers(id) on delete cascade not null,
  substitute_driver_id uuid references public.drivers(id) on delete cascade not null,
  date date not null,
  is_active boolean default true not null,
  unique (route_id, date)
);

-- Mensajería estructurada
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id) on delete cascade not null,
  driver_id uuid references public.drivers(id) on delete cascade not null,
  content text not null,
  type text default 'PREDEFINED' not null,
  created_at timestamptz default now() not null
);

-- =========================================================================
-- 3. TRIGGERS Y FUNCIONES DE AUTOMATIZACIÓN

-- NOTA: La creación de perfil (public.users / drivers / parents) la hace la app
-- directamente desde mobile/src/servicios/auth.service.ts justo después del
-- signUp, en vez de un trigger en auth.users. Esto evita errores silenciosos
-- de "Database error saving new user" cuando el trigger falla dentro de la
-- transacción de Supabase Auth. No crear trigger on_auth_user_created aquí.

-- Actualización automática del campo updated_at en public.users
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- =========================================================================
-- 4. SEGURIDAD A NIVEL DE FILAS (ROW LEVEL SECURITY - RLS)

-- Habilitar RLS en tablas clave
alter table public.users enable row level security;
alter table public.drivers enable row level security;
alter table public.parents enable row level security;
alter table public.students enable row level security;
alter table public.routes enable row level security;
alter table public.stops enable row level security;
alter table public.trips enable row level security;
alter table public.boardings enable row level security;
alter table public.absences enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.traffic_alerts enable row level security;
alter table public.driver_substitutions enable row level security;

-- Políticas para users
create policy "Permitir lectura de perfiles a usuarios autenticados"
  on public.users for select
  using (auth.role() = 'authenticated');

create policy "Permitir creación de perfil propio"
  on public.users for insert
  with check (auth.uid() = id);

create policy "Permitir actualización de perfil propio"
  on public.users for update
  using (auth.uid() = id);

-- Políticas para drivers y parents (Solo lectura para red de usuarios, edición propia)
create policy "Lectura de conductores" on public.drivers for select using (auth.role() = 'authenticated');
create policy "Creación de conductor propio" on public.drivers for insert with check (auth.uid() = id);
create policy "Edición de conductor propio" on public.drivers for update using (auth.uid() = id);

create policy "Lectura de padres" on public.parents for select using (auth.role() = 'authenticated');
create policy "Creación de padre propio" on public.parents for insert with check (auth.uid() = id);
create policy "Edición de padre propio" on public.parents for update using (auth.uid() = id);

-- Políticas para students
create policy "Lectura de estudiantes asignados" 
  on public.students for select 
  using (auth.uid() = driver_id or auth.uid() = parent_id);

create policy "Gestión de estudiantes (solo conductores)" 
  on public.students for all 
  using (auth.uid() = driver_id);

-- Políticas para routes
create policy "Lectura de rutas" on public.routes for select using (auth.role() = 'authenticated');
create policy "Gestión de rutas (conductores)" on public.routes for all using (auth.uid() = driver_id);

-- Políticas para stops
create policy "Lectura de paradas" on public.stops for select using (auth.role() = 'authenticated');
create policy "Gestión de paradas (conductores)" on public.stops for all using (
  exists (select 1 from public.routes r where r.id = route_id and r.driver_id = auth.uid())
);

-- Políticas para trips y boardings
create policy "Lectura de viajes" on public.trips for select using (auth.role() = 'authenticated');
create policy "Gestión de viajes (conductores)" on public.trips for all using (auth.uid() = driver_id or auth.uid() = substitute_driver_id);

create policy "Lectura de abordajes" on public.boardings for select using (auth.role() = 'authenticated');
create policy "Registrar abordajes (conductores)" on public.boardings for all using (
  exists (select 1 from public.trips t where t.id = trip_id and (t.driver_id = auth.uid() or t.substitute_driver_id = auth.uid()))
);

-- Políticas para absences
create policy "Lectura de ausencias" on public.absences for select using (auth.role() = 'authenticated');
create policy "Gestión de ausencias (padres)" on public.absences for all using (auth.uid() = registered_by);

-- Políticas para payments
create policy "Lectura de pagos" on public.payments for select using (
  auth.uid() = driver_id or 
  exists (select 1 from public.students s where s.id = student_id and s.parent_id = auth.uid())
);
create policy "Gestión de pagos (conductores)" on public.payments for all using (auth.uid() = driver_id);

-- Políticas para notifications
create policy "Ver notificaciones propias" on public.notifications for select using (auth.uid() = user_id);
create policy "Actualizar lectura de notificaciones propias" on public.notifications for update using (auth.uid() = user_id);

-- Políticas para messages
create policy "Lectura de mensajes de ruta" on public.messages for select using (
  auth.uid() = driver_id or 
  exists (
    select 1 from public.students s 
    join public.routes r on r.driver_id = s.driver_id
    where r.id = route_id and s.parent_id = auth.uid()
  )
);
create policy "Enviar mensajes (conductores)" on public.messages for insert with check (auth.uid() = driver_id);

-- Políticas para traffic_alerts
create policy "Lectura de alertas de tráfico" on public.traffic_alerts for select using (auth.role() = 'authenticated');
create policy "Gestión de alertas de tráfico (conductores de la ruta)" on public.traffic_alerts for all using (
  exists (select 1 from public.routes r where r.id = route_id and r.driver_id = auth.uid())
);

-- Políticas para driver_substitutions
create policy "Lectura de sustituciones" on public.driver_substitutions for select using (auth.role() = 'authenticated');
create policy "Gestión de sustituciones (conductor titular)" on public.driver_substitutions for all using (auth.uid() = titular_driver_id);
