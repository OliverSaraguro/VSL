import { supabase } from '../config/supabase';
import { Coordinates } from '../types';

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

export interface TrafficAlert {
  id: string;
  routeId: string;
  description: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
}

function mapAlert(db: any): TrafficAlert {
  return {
    id: db.id,
    routeId: db.route_id,
    description: db.description,
    latitude: db.latitude,
    longitude: db.longitude,
    isActive: db.is_active,
    createdAt: db.created_at,
  };
}

// HU21/HU22: en el backlog estas alertas vienen de la API de tráfico de Google Maps, que requiere
// una clave de Google Cloud con facturación habilitada (no disponible en este entorno). Mientras
// tanto, el conductor puede reportar manualmente una incidencia (cierre, accidente) para que el
// banner y la lógica de "ruta alternativa" sean reales y comprobables; conectar la API real es
// un cambio aislado a este archivo cuando se tenga la credencial.
class TrafficService {
  async report(routeId: string, description: string, coords: Coordinates): Promise<TrafficAlert> {
    const { data, error } = await withTimeout(
      supabase
        .from('traffic_alerts')
        .insert({
          route_id: routeId,
          description,
          latitude: coords.latitude,
          longitude: coords.longitude,
          is_active: true,
        })
        .select()
        .single(),
      'reportar incidencia de tráfico',
    );
    if (error) throw error;
    return mapAlert(data);
  }

  async getActiveForRoute(routeId: string): Promise<TrafficAlert[]> {
    const { data, error } = await withTimeout(
      supabase
        .from('traffic_alerts')
        .select('*')
        .eq('route_id', routeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      'cargar alertas de tráfico',
    );
    if (error) throw error;
    return (data || []).map(mapAlert);
  }

  async resolve(id: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('traffic_alerts').update({ is_active: false }).eq('id', id),
      'resolver alerta de tráfico',
    );
    if (error) throw error;
  }
}

export default new TrafficService();
