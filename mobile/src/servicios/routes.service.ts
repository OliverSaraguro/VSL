import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/auth.store';
import { Route, Stop, Trip, Boarding, Student, PaginatedResponse, TripStatus } from '../types';

// El id del usuario logueado ya vive en el store de autenticación (se llena al iniciar sesión
// y se mantiene al día con onAuthStateChange). Usarlo en vez de volver a pedirlo a Supabase con
// supabase.auth.getUser() evita un round-trip de red innecesario y el deadlock conocido del
// lock interno de supabase-js en React Native cuando getUser()/getSession() se llaman seguido.
function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Evita que una llamada a Supabase se quede colgada indefinidamente (p.ej. red inestable del emulador
// o caché de esquema de PostgREST desactualizado tras un alter table)
function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado en "${label}" (revisa tu conexión a internet)`));
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Mapeadores para pasar de Postgres snake_case a TypeScript camelCase
function mapStudent(db: any): Student {
  return {
    id: db.id,
    name: db.name,
    address: db.address,
    latitude: db.latitude,
    longitude: db.longitude,
    photoUrl: db.photo_url,
    driverId: db.driver_id,
    parentId: db.parent_id,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}

function mapStop(db: any): Stop {
  return {
    id: db.id,
    routeId: db.route_id,
    name: db.student?.name || `Parada ${db.order}`,
    address: db.address,
    latitude: db.latitude,
    longitude: db.longitude,
    order: db.order,
    estimatedTime: db.estimated_time,
    students: db.student ? [mapStudent(db.student)] : [],
  };
}

function mapRoute(db: any): Route {
  return {
    id: db.id,
    name: db.name,
    description: '',
    driverId: db.driver_id,
    stops: db.stops ? db.stops.map(mapStop).sort((a: Stop, b: Stop) => a.order - b.order) : [],
    students: db.stops ? db.stops.map((s: any) => s.student).filter(Boolean).map(mapStudent) : [],
    startTime: '',
    endTime: '',
    isActive: db.is_active,
    daysOfWeek: [],
    destinationName: db.destination_name ?? undefined,
    destinationAddress: db.destination_address ?? undefined,
    destinationLatitude: db.destination_latitude ?? undefined,
    destinationLongitude: db.destination_longitude ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.created_at,
  };
}

function mapBoarding(db: any): Boarding {
  return {
    id: db.id,
    tripId: db.trip_id,
    studentId: db.student_id,
    boardedAt: db.boarded_at,
    isAbsent: false,
    createdAt: db.boarded_at,
  };
}

function mapTrip(db: any): Trip {
  return {
    id: db.id,
    routeId: db.route_id,
    driverId: db.driver_id,
    status: db.status as TripStatus,
    startedAt: db.started_at,
    completedAt: db.finished_at,
    date: db.started_at ? db.started_at.split('T')[0] : '',
    boardings: db.boardings ? db.boardings.map(mapBoarding) : [],
    createdAt: db.started_at,
  };
}

class RoutesService {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Route>> {
    const limit = (params?.limit as number) || 10;
    const page = (params?.page as number) || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Obtener rutas de Supabase con sus respectivas paradas y estudiantes asociados
    const { data, error, count } = await withTimeout(
      supabase
        .from('routes')
        .select('*, stops(*, student:students(*))', { count: 'exact' })
        .range(from, to),
      'cargar rutas',
    );

    if (error) throw error;

    const items = (data || []).map(mapRoute);
    const total = count || 0;

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string): Promise<Route> {
    const { data, error } = await withTimeout(
      supabase
        .from('routes')
        .select('*, stops(*, student:students(*))')
        .eq('id', id)
        .single(),
      'cargar ruta',
    );

    if (error) throw error;
    return mapRoute(data);
  }

  async create(payload: Partial<Route>): Promise<Route> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error } = await withTimeout(
      supabase
        .from('routes')
        .insert({
          name: payload.name,
          is_active: payload.isActive ?? true,
          driver_id: payload.driverId ?? userId,
          destination_name: payload.destinationName ?? null,
          destination_address: payload.destinationAddress ?? null,
          destination_latitude: payload.destinationLatitude ?? null,
          destination_longitude: payload.destinationLongitude ?? null,
        })
        .select()
        .single(),
      'crear ruta',
    );

    if (error) throw error;
    return mapRoute(data);
  }

  async update(id: string, payload: Partial<Route>): Promise<Route> {
    const { data, error } = await withTimeout(
      supabase
        .from('routes')
        .update({
          name: payload.name,
          is_active: payload.isActive,
        })
        .eq('id', id)
        .select()
        .single(),
      'actualizar ruta',
    );

    if (error) throw error;
    return mapRoute(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('routes').delete().eq('id', id),
      'eliminar ruta',
    );

    if (error) throw error;
  }

  async getStops(routeId: string): Promise<Stop[]> {
    const { data, error } = await withTimeout(
      supabase
        .from('stops')
        .select('*, student:students(*)')
        .eq('route_id', routeId)
        .order('order', { ascending: true }),
      'cargar paradas',
    );

    if (error) throw error;
    return (data || []).map(mapStop);
  }

  async addStop(routeId: string, payload: Partial<Stop>): Promise<Stop> {
    const { data, error } = await withTimeout(
      supabase
        .from('stops')
        .insert({
          route_id: routeId,
          student_id: payload.studentId,
          order: payload.order,
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          estimated_time: payload.estimatedTime,
        })
        .select('*, student:students(*)')
        .single(),
      'agregar parada',
    );

    if (error) throw error;
    return mapStop(data);
  }

  async updateStop(routeId: string, stopId: string, payload: Partial<Stop>): Promise<Stop> {
    const { data, error } = await withTimeout(
      supabase
        .from('stops')
        .update({
          order: payload.order,
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          estimated_time: payload.estimatedTime,
          student_id: payload.studentId,
        })
        .eq('id', stopId)
        .eq('route_id', routeId)
        .select('*, student:students(*)')
        .single(),
      'actualizar parada',
    );

    if (error) throw error;
    return mapStop(data);
  }

  async removeStop(routeId: string, stopId: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('stops').delete().eq('id', stopId).eq('route_id', routeId),
      'eliminar parada',
    );

    if (error) throw error;
  }

  async getTodayRoute(): Promise<Route | null> {
    // Para simplificar el MVP, retornamos la primera ruta activa del conductor autenticado
    const userId = getCurrentUserId();
    if (!userId) return null;

    console.log('[routes] getTodayRoute: consultando routes...');
    const { data, error } = await withTimeout(
      supabase
        .from('routes')
        .select('*, stops(*, student:students(*))')
        .eq('driver_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'cargar ruta de hoy',
    );
    console.log('[routes] getTodayRoute: consulta OK', { hasData: !!data, error });

    if (error) throw error;
    return data ? mapRoute(data) : null;
  }

  async getActiveTrip(): Promise<Trip | null> {
    const userId = getCurrentUserId();
    if (!userId) return null;
    return this.getActiveTripByDriver(userId);
  }

  // Variante para que un padre consulte el viaje activo del conductor de SU hijo (no el propio).
  // La política de RLS de "trips" permite lectura a cualquier usuario autenticado.
  async getActiveTripByDriver(driverId: string): Promise<Trip | null> {
    if (!driverId) return null;

    const { data, error } = await withTimeout(
      supabase
        .from('trips')
        .select('*, boardings(*)')
        .or(`driver_id.eq.${driverId},substitute_driver_id.eq.${driverId}`)
        .in('status', ['in_progress', 'paused'])
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'cargar viaje activo del conductor',
    );

    if (error) throw error;
    return data ? mapTrip(data) : null;
  }

  // Última ruta finalizada del conductor (para mostrar "última posición conocida" cuando no hay
  // viaje activo, y para el resumen de fin de recorrido).
  async getLastTripByDriver(driverId: string): Promise<Trip | null> {
    if (!driverId) return null;

    const { data, error } = await withTimeout(
      supabase
        .from('trips')
        .select('*, boardings(*)')
        .eq('driver_id', driverId)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      'cargar último viaje del conductor',
    );

    if (error) throw error;
    return data ? mapTrip(data) : null;
  }

  // Ruta activa del conductor del estudiante de un padre (no la del usuario autenticado).
  async getTodayRouteByDriver(driverId: string): Promise<Route | null> {
    if (!driverId) return null;

    const { data, error } = await withTimeout(
      supabase
        .from('routes')
        .select('*, stops(*, student:students(*))')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      'cargar ruta del conductor',
    );

    if (error) throw error;
    return data ? mapRoute(data) : null;
  }

  async startTrip(routeId: string): Promise<Trip> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error } = await withTimeout(
      supabase
        .from('trips')
        .insert({
          route_id: routeId,
          driver_id: userId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('*, boardings(*)')
        .single(),
      'iniciar viaje',
    );

    if (error) throw error;
    return mapTrip(data);
  }

  async completeTrip(tripId: string): Promise<Trip> {
    const { data, error } = await withTimeout(
      supabase
        .from('trips')
        .update({
          status: 'completed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', tripId)
        .select('*, boardings(*)')
        .single(),
      'completar viaje',
    );

    if (error) throw error;
    return mapTrip(data);
  }

  async pauseTrip(tripId: string): Promise<Trip> {
    const { data, error } = await withTimeout(
      supabase
        .from('trips')
        .update({
          status: 'paused',
        })
        .eq('id', tripId)
        .select('*, boardings(*)')
        .single(),
      'pausar viaje',
    );

    if (error) throw error;
    return mapTrip(data);
  }

  async resumeTrip(tripId: string): Promise<Trip> {
    const { data, error } = await withTimeout(
      supabase
        .from('trips')
        .update({
          status: 'in_progress',
        })
        .eq('id', tripId)
        .select('*, boardings(*)')
        .single(),
      'reanudar viaje',
    );

    if (error) throw error;
    return mapTrip(data);
  }

  async getTripHistory(params?: Record<string, unknown>): Promise<PaginatedResponse<Trip>> {
    const limit = (params?.limit as number) || 10;
    const page = (params?.page as number) || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await withTimeout(
      supabase
        .from('trips')
        .select('*, boardings(*)', { count: 'exact' })
        .order('started_at', { ascending: false })
        .range(from, to),
      'cargar historial de viajes',
    );

    if (error) throw error;

    const items = (data || []).map(mapTrip);
    const total = count || 0;

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default new RoutesService();
