import { supabase } from '../config/supabase';
import { Route, Stop, Trip, Boarding, Student, PaginatedResponse, TripStatus } from '../types';

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
    stops: db.stops ? db.stops.map(mapStop) : [],
    students: db.stops ? db.stops.map((s: any) => s.student).filter(Boolean).map(mapStudent) : [],
    startTime: '',
    endTime: '',
    isActive: db.is_active,
    daysOfWeek: [],
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
    const { data, error, count } = await supabase
      .from('routes')
      .select('*, stops(*, student:students(*))', { count: 'exact' })
      .range(from, to);

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
    const { data, error } = await supabase
      .from('routes')
      .select('*, stops(*, student:students(*))')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapRoute(data);
  }

  async create(payload: Partial<Route>): Promise<Route> {
    const { data, error } = await supabase
      .from('routes')
      .insert({
        name: payload.name,
        is_active: payload.isActive ?? true,
        driver_id: payload.driverId,
      })
      .select()
      .single();

    if (error) throw error;
    return mapRoute(data);
  }

  async update(id: string, payload: Partial<Route>): Promise<Route> {
    const { data, error } = await supabase
      .from('routes')
      .update({
        name: payload.name,
        is_active: payload.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRoute(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getStops(routeId: string): Promise<Stop[]> {
    const { data, error } = await supabase
      .from('stops')
      .select('*, student:students(*)')
      .eq('route_id', routeId)
      .order('order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapStop);
  }

  async addStop(routeId: string, payload: Partial<Stop>): Promise<Stop> {
    const { data, error } = await supabase
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
      .single();

    if (error) throw error;
    return mapStop(data);
  }

  async updateStop(routeId: string, stopId: string, payload: Partial<Stop>): Promise<Stop> {
    const { data, error } = await supabase
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
      .single();

    if (error) throw error;
    return mapStop(data);
  }

  async removeStop(routeId: string, stopId: string): Promise<void> {
    const { error } = await supabase
      .from('stops')
      .delete()
      .eq('id', stopId)
      .eq('route_id', routeId);

    if (error) throw error;
  }

  async getTodayRoute(): Promise<Route | null> {
    // Para simplificar el MVP, retornamos la primera ruta activa del conductor autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('routes')
      .select('*, stops(*, student:students(*))')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapRoute(data) : null;
  }

  async getActiveTrip(): Promise<Trip | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('trips')
      .select('*, boardings(*)')
      .eq('driver_id', user.id)
      .in('status', ['in_progress', 'paused'])
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? mapTrip(data) : null;
  }

  async startTrip(routeId: string): Promise<Trip> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const { data, error } = await supabase
      .from('trips')
      .insert({
        route_id: routeId,
        driver_id: user.id,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('*, boardings(*)')
      .single();

    if (error) throw error;
    return mapTrip(data);
  }

  async completeTrip(tripId: string): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', tripId)
      .select('*, boardings(*)')
      .single();

    if (error) throw error;
    return mapTrip(data);
  }

  async pauseTrip(tripId: string): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'paused',
      })
      .eq('id', tripId)
      .select('*, boardings(*)')
      .single();

    if (error) throw error;
    return mapTrip(data);
  }

  async resumeTrip(tripId: string): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .update({
        status: 'in_progress',
      })
      .eq('id', tripId)
      .select('*, boardings(*)')
      .single();

    if (error) throw error;
    return mapTrip(data);
  }

  async getTripHistory(params?: Record<string, unknown>): Promise<PaginatedResponse<Trip>> {
    const limit = (params?.limit as number) || 10;
    const page = (params?.page as number) || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('trips')
      .select('*, boardings(*)', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(from, to);

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
