import { Coordinates } from '../types';

type TrackingEventHandler = (data: unknown) => void;

interface LocationUpdate {
  tripId: string;
  driverId: string;
  coordinates: Coordinates;
  timestamp: string;
  speed?: number;
  heading?: number;
}

class TrackingService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<TrackingEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private token: string | null = null;

  connect(token: string, tripId?: string): void {
    this.token = token;

    const baseUrl = __DEV__
      ? 'ws://192.168.1.100:3000'
      : 'wss://api.vsl-loja.com';

    const params = new URLSearchParams({ token });
    if (tripId) params.append('tripId', tripId);

    this.ws = new WebSocket(`${baseUrl}/tracking?${params.toString()}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPing();
      this.emit('connected', null);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as {
          type: string;
          data: unknown;
        };
        this.emit(message.type, message.data);
      } catch {
        /* ignore malformed messages */
      }
    };

    this.ws.onerror = () => {
      this.emit('error', { message: 'WebSocket error' });
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.emit('disconnected', null);
      this.attemptReconnect(tripId);
    };
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.stopPing();
    this.ws?.close();
    this.ws = null;
    this.listeners.clear();
  }

  sendLocation(update: LocationUpdate): void {
    this.send('location_update', update);
  }

  sendBoarding(tripId: string, studentId: string, stopId: string): void {
    this.send('student_boarded', { tripId, studentId, stopId });
  }

  sendDropoff(tripId: string, studentId: string, stopId: string): void {
    this.send('student_dropped', { tripId, studentId, stopId });
  }

  on(event: string, handler: TrackingEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)?.delete(handler);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(type: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }

  private attemptReconnect(tripId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.token) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(this.token!, tripId);
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send('ping', { timestamp: Date.now() });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

export default new TrackingService();
