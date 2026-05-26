import { prisma } from '../../config/database';
import { AppError, TripStatus, Coordinates } from '../../shared/types';

const DEVIATION_THRESHOLD_METERS = 500;

export class TrackingService {
  async startTrip(driverId: string, routeId: string) {
    const route = await prisma.route.findFirst({
      where: { id: routeId, driverId, isActive: true },
    });
    if (!route) {
      throw new AppError('Ruta no encontrada o inactiva', 404);
    }

    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId,
        status: { in: [TripStatus.IN_PROGRESS, TripStatus.PAUSED] },
      },
    });
    if (activeTrip) {
      throw new AppError('Ya tienes un viaje activo. Finalízalo antes de iniciar otro', 400);
    }

    return prisma.trip.create({
      data: {
        routeId,
        driverId,
        status: TripStatus.IN_PROGRESS,
      },
      include: {
        route: {
          include: {
            stops: { orderBy: { order: 'asc' } },
          },
        },
      },
    });
  }

  async pauseTrip(tripId: string, driverId: string) {
    const trip = await this.getActiveTrip(tripId, driverId);

    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new AppError('Solo se pueden pausar viajes en progreso', 400);
    }

    return prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.PAUSED,
        pausedAt: new Date(),
      },
    });
  }

  async resumeTrip(tripId: string, driverId: string) {
    const trip = await this.getActiveTrip(tripId, driverId);

    if (trip.status !== TripStatus.PAUSED) {
      throw new AppError('Solo se pueden reanudar viajes pausados', 400);
    }

    return prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.IN_PROGRESS,
        pausedAt: null,
      },
    });
  }

  async finishTrip(tripId: string, driverId: string) {
    const trip = await this.getActiveTrip(tripId, driverId);

    if (trip.status === TripStatus.COMPLETED) {
      throw new AppError('Este viaje ya fue finalizado', 400);
    }

    return prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.COMPLETED,
        finishedAt: new Date(),
      },
    });
  }

  async registerLocation(
    tripId: string,
    driverId: string,
    location: Coordinates & { speed?: number; heading?: number },
  ) {
    await this.getActiveTrip(tripId, driverId);

    const tripLocation = await prisma.tripLocation.create({
      data: {
        tripId,
        latitude: location.latitude,
        longitude: location.longitude,
        speed: location.speed,
        heading: location.heading,
      },
    });

    return tripLocation;
  }

  async detectDeviation(tripId: string): Promise<boolean> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        route: {
          include: { stops: { orderBy: { order: 'asc' } } },
        },
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!trip || trip.locations.length === 0 || trip.route.stops.length === 0) {
      return false;
    }

    const lastLocation = trip.locations[0];
    const stops = trip.route.stops;

    const minDistance = Math.min(
      ...stops.map((stop) =>
        this.calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          stop.latitude,
          stop.longitude,
        ),
      ),
    );

    return minDistance > DEVIATION_THRESHOLD_METERS;
  }

  async getTripHistory(driverId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where: { driverId },
        include: {
          route: { select: { id: true, name: true } },
          _count: { select: { locations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where: { driverId } }),
    ]);

    return {
      trips,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getActiveTripForParent(parentId: string) {
    const students = await prisma.student.findMany({
      where: { parentId },
      select: { routeId: true },
    });

    const routeIds = students
      .map((s) => s.routeId)
      .filter((id): id is string => id !== null);

    if (routeIds.length === 0) return null;

    return prisma.trip.findFirst({
      where: {
        routeId: { in: routeIds },
        status: { in: [TripStatus.IN_PROGRESS, TripStatus.PAUSED] },
      },
      include: {
        route: {
          include: { stops: { orderBy: { order: 'asc' } } },
        },
        driver: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        locations: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });
  }

  private async getActiveTrip(tripId: string, driverId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new AppError('Viaje no encontrado', 404);
    }

    if (trip.driverId !== driverId) {
      throw new AppError('No tienes acceso a este viaje', 403);
    }

    return trip;
  }

  /** Haversine formula — returns distance in meters */
  private calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
  ): number {
    const R = 6_371_000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export const trackingService = new TrackingService();
