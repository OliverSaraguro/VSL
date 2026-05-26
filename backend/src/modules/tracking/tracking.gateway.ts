import { Server as IOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyToken } from '../../shared/utils/token';
import { trackingService } from './tracking.service';
import { Role } from '../../shared/types';

interface LocationPayload {
  tripId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
}

export class TrackingGateway {
  private io: IOServer;

  constructor(httpServer: HttpServer) {
    this.io = new IOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use(this.authMiddleware.bind(this));
    this.registerEvents();
  }

  private authMiddleware(socket: Socket, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      return next(new Error('Token de autenticación requerido'));
    }

    try {
      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  }

  private registerEvents() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user;
      console.log(`[WS] Conectado: ${user.email} (${user.role})`);

      if (user.role === Role.DRIVER) {
        this.handleDriverEvents(socket);
      } else {
        this.handleParentEvents(socket);
      }

      socket.on('disconnect', () => {
        console.log(`[WS] Desconectado: ${user.email}`);
      });
    });
  }

  private handleDriverEvents(socket: Socket) {
    socket.on('location:update', async (payload: LocationPayload) => {
      try {
        const driverId = socket.data.user.userId;

        await trackingService.registerLocation(payload.tripId, driverId, {
          latitude: payload.latitude,
          longitude: payload.longitude,
          speed: payload.speed,
          heading: payload.heading,
        });

        this.io.to(`trip:${payload.tripId}`).emit('location:updated', {
          tripId: payload.tripId,
          latitude: payload.latitude,
          longitude: payload.longitude,
          speed: payload.speed,
          heading: payload.heading,
          timestamp: new Date().toISOString(),
        });

        const isDeviated = await trackingService.detectDeviation(payload.tripId);
        if (isDeviated) {
          this.io.to(`trip:${payload.tripId}`).emit('trip:deviation', {
            tripId: payload.tripId,
            message: 'El vehículo se ha desviado de la ruta establecida',
            latitude: payload.latitude,
            longitude: payload.longitude,
          });
        }
      } catch (error) {
        socket.emit('error', {
          message: error instanceof Error ? error.message : 'Error al registrar ubicación',
        });
      }
    });

    socket.on('trip:join', (tripId: string) => {
      socket.join(`trip:${tripId}`);
    });

    socket.on('trip:leave', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });
  }

  private handleParentEvents(socket: Socket) {
    socket.on('trip:subscribe', (tripId: string) => {
      socket.join(`trip:${tripId}`);
      socket.emit('trip:subscribed', { tripId });
    });

    socket.on('trip:unsubscribe', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
    });
  }

  emitTripStarted(tripId: string, routeId: string) {
    this.io.emit('trip:started', { tripId, routeId });
  }

  emitTripFinished(tripId: string) {
    this.io.to(`trip:${tripId}`).emit('trip:finished', { tripId });
  }
}

let gatewayInstance: TrackingGateway | null = null;

export function initTrackingGateway(httpServer: HttpServer): TrackingGateway {
  gatewayInstance = new TrackingGateway(httpServer);
  return gatewayInstance;
}

export function getTrackingGateway(): TrackingGateway {
  if (!gatewayInstance) {
    throw new Error('TrackingGateway no ha sido inicializado');
  }
  return gatewayInstance;
}
