import { supabase } from '../config/supabase';
import { Coordinates } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

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

type TrackingEventHandler = (data: any) => void;

interface LocationUpdate {
  tripId: string;
  driverId: string;
  coordinates: Coordinates;
  timestamp: string;
  speed?: number;
  heading?: number;
}

class TrackingService {
  private channel: RealtimeChannel | null = null;
  private listeners: Map<string, Set<TrackingEventHandler>> = new Map();
  private isSubscribed = false;

  // Conectar usando Supabase Realtime Channels
  connect(token: string, tripId?: string): void {
    if (!tripId) return;

    this.disconnect();

    // Crear un canal en tiempo real específico para este viaje
    this.channel = supabase.channel(`trip:${tripId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    this.channel
      // Escuchar eventos de geolocalización transmitidos en tiempo real por el conductor
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        this.emit('location_update', payload);
      })
      // Escuchar eventos de abordaje transmitidos por el conductor
      .on('broadcast', { event: 'student_boarded' }, ({ payload }) => {
        this.emit('student_boarded', payload);
      })
      .on('broadcast', { event: 'student_dropped' }, ({ payload }) => {
        this.emit('student_dropped', payload);
      })
      // Escuchar también inserciones directas en la base de datos de la tabla boardings
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'boardings',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          this.emit('db_boarding_added', payload.new);
        }
      );

    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.isSubscribed = true;
        this.emit('connected', null);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.isSubscribed = false;
        this.emit('disconnected', null);
      }
    });
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isSubscribed = false;
    this.listeners.clear();
  }

  // Transmitir ubicación actual del GPS mediante broadcast
  sendLocation(update: LocationUpdate): void {
    if (!this.channel || !this.isSubscribed) return;

    this.channel.send({
      type: 'broadcast',
      event: 'location_update',
      payload: update,
    });
  }

  // Registrar abordaje en base de datos y transmitir el evento
  async sendBoarding(tripId: string, studentId: string, stopId: string, coords?: Coordinates): Promise<void> {
    // 1. Guardar de forma persistente en la tabla public.boardings
    const { error } = await withTimeout(
      supabase.from('boardings').insert({
        trip_id: tripId,
        student_id: studentId,
        latitude: coords?.latitude || 0,
        longitude: coords?.longitude || 0,
      }),
      'registrar abordaje',
    );

    if (error) {
      console.error('Error al registrar abordaje en DB:', error.message);
      throw error;
    }

    // 2. Transmitir evento en tiempo real a los oyentes (padres)
    if (this.channel && this.isSubscribed) {
      this.channel.send({
        type: 'broadcast',
        event: 'student_boarded',
        payload: { tripId, studentId, stopId },
      });
    }
  }

  // Registrar llegada/desabordaje y transmitir el evento
  async sendDropoff(tripId: string, studentId: string, stopId: string, coords?: Coordinates): Promise<void> {
    // En el esquema MVP, desabordar significa eliminar la fila de abordaje o marcarla (eliminamos para este ejemplo)
    const { error } = await withTimeout(
      supabase.from('boardings').delete().eq('trip_id', tripId).eq('student_id', studentId),
      'registrar descenso',
    );

    if (error) {
      console.error('Error al registrar descenso en DB:', error.message);
      throw error;
    }

    if (this.channel && this.isSubscribed) {
      this.channel.send({
        type: 'broadcast',
        event: 'student_dropped',
        payload: { tripId, studentId, stopId },
      });
    }
  }

  on(event: string, handler: TrackingEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  get isConnected(): boolean {
    return this.isSubscribed;
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }
}

export default new TrackingService();
