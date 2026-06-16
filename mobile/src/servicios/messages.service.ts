import { supabase } from '../config/supabase';

// Evita que una llamada a Supabase se quede colgada indefinidamente (p.ej. red inestable del emulador)
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

export interface RouteMessage {
  id: string;
  content: string;
  createdAt: string;
}

class MessagesService {
  // Guarda en el historial de mensajería estructurada de la ruta (HU16/HU30). El aviso a los
  // padres se hace por separado vía notifications.service.createMany para que quede en su feed.
  async send(routeId: string, driverId: string, content: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('messages').insert({
        route_id: routeId,
        driver_id: driverId,
        content,
        type: 'PREDEFINED',
      }),
      'enviar mensaje',
    );
    if (error) throw error;
  }

  // HU30: historial de mensajes predefinidos enviados en una ruta, para que el conductor (y
  // eventualmente el padre) pueda revisar qué se avisó y a qué hora.
  async getHistory(routeId: string): Promise<RouteMessage[]> {
    const { data, error } = await withTimeout(
      supabase
        .from('messages')
        .select('id, content, created_at')
        .eq('route_id', routeId)
        .order('created_at', { ascending: false }),
      'cargar historial de mensajes',
    );
    if (error) throw error;
    return (data || []).map((m: any) => ({ id: m.id, content: m.content, createdAt: m.created_at }));
  }
}

export default new MessagesService();
