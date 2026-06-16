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
}

export default new MessagesService();
