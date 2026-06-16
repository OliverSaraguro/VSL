import { supabase } from '../config/supabase';

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

export interface Substitution {
  id: string;
  routeId: string;
  titularDriverId: string;
  substituteDriverId: string;
  substituteName: string;
  substitutePhotoUrl?: string;
  date: string;
  isActive: boolean;
}

function mapSubstitution(db: any, driverName?: string, driverPhoto?: string): Substitution {
  return {
    id: db.id,
    routeId: db.route_id,
    titularDriverId: db.titular_driver_id,
    substituteDriverId: db.substitute_driver_id,
    substituteName: driverName ?? 'Conductor sustituto',
    substitutePhotoUrl: driverPhoto,
    date: db.date,
    isActive: db.is_active,
  };
}

class SubstitutionsService {
  // Busca un conductor verificado por correo, para autorizarlo como sustituto (HU25: "solo
  // conductores con cuenta activa y verificada pueden ser sustitutos").
  async findVerifiedDriverByEmail(email: string): Promise<{ id: string; name: string } | null> {
    const { data, error } = await withTimeout(
      supabase
        .from('users')
        .select('id, name, drivers!inner(is_verified)')
        .eq('email', email.trim().toLowerCase())
        .eq('role', 'DRIVER')
        .eq('drivers.is_verified', true)
        .maybeSingle(),
      'buscar conductor sustituto',
    );
    if (error) throw error;
    return data ? { id: data.id, name: data.name } : null;
  }

  async authorize(routeId: string, titularDriverId: string, substituteDriverId: string, date: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('driver_substitutions').upsert(
        {
          route_id: routeId,
          titular_driver_id: titularDriverId,
          substitute_driver_id: substituteDriverId,
          date,
          is_active: true,
        },
        { onConflict: 'route_id,date' },
      ),
      'autorizar conductor sustituto',
    );
    if (error) throw error;
  }

  async revoke(id: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('driver_substitutions').update({ is_active: false }).eq('id', id),
      'revocar autorización',
    );
    if (error) throw error;
  }

  async getUpcomingForRoute(routeId: string): Promise<Substitution[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await withTimeout(
      supabase
        .from('driver_substitutions')
        .select('*')
        .eq('route_id', routeId)
        .eq('is_active', true)
        .gte('date', today)
        .order('date', { ascending: true }),
      'cargar sustituciones',
    );
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Segunda consulta simple para traer nombre/foto del sustituto (más confiable que anidar
    // drivers -> users en un solo select de PostgREST).
    const ids = Array.from(new Set(data.map((row: any) => row.substitute_driver_id)));
    const { data: users } = await withTimeout(
      supabase.from('users').select('id, name, photo_url').in('id', ids),
      'cargar datos de conductores sustitutos',
    );
    const byId = new Map((users || []).map((u: any) => [u.id, u]));

    return data.map((row: any) => {
      const u = byId.get(row.substitute_driver_id);
      return mapSubstitution(row, u?.name, u?.photo_url);
    });
  }
}

export default new SubstitutionsService();
