import { prisma } from '../../config/database';
import { AppError } from '../../shared/types';

export class RoutesService {
  async findTodayRoute(driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });
    if (!driver) throw new AppError('Conductor no encontrado', 404);

    const route = await prisma.route.findFirst({
      where: { driverId: driver.id, isActive: true },
      include: {
        stops: {
          orderBy: { order: 'asc' },
          include: { student: true },
        },
        trips: {
          where: { status: 'ACTIVE' },
          include: { boardings: true },
          take: 1,
        },
      },
    });

    return route;
  }

  async findAllByDriver(driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });
    if (!driver) return [];

    return prisma.route.findMany({
      where: { driverId: driver.id },
      include: {
        stops: { orderBy: { order: 'asc' }, include: { student: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(routeId: string, driverId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });
    if (!driver) throw new AppError('Conductor no encontrado', 404);

    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        stops: { orderBy: { order: 'asc' }, include: { student: true } },
        trips: { orderBy: { startedAt: 'desc' }, take: 5 },
      },
    });

    if (!route || route.driverId !== driver.id) {
      throw new AppError('Ruta no encontrada', 404);
    }

    return route;
  }

  async create(driverId: string, data: { name: string }) {
    const driver = await prisma.driver.findUnique({
      where: { userId: driverId },
    });
    if (!driver) throw new AppError('Conductor no encontrado', 404);

    return prisma.route.create({
      data: { name: data.name, driverId: driver.id },
      include: { stops: true },
    });
  }

  async update(routeId: string, driverId: string, data: { name?: string; isActive?: boolean }) {
    const route = await this.findById(routeId, driverId);
    return prisma.route.update({
      where: { id: route.id },
      data,
      include: { stops: { orderBy: { order: 'asc' } } },
    });
  }

  async delete(routeId: string, driverId: string) {
    await this.findById(routeId, driverId);
    await prisma.route.delete({ where: { id: routeId } });
  }

  async addStop(routeId: string, driverId: string, data: { studentId: string; address: string; latitude: number; longitude: number; estimatedTime: string }) {
    await this.findById(routeId, driverId);
    const maxOrder = await prisma.stop.count({ where: { routeId } });
    return prisma.stop.create({
      data: { ...data, routeId, order: maxOrder + 1 },
      include: { student: true },
    });
  }

  async updateStop(routeId: string, stopId: string, driverId: string, data: { address?: string; estimatedTime?: string; order?: number }) {
    await this.findById(routeId, driverId);
    return prisma.stop.update({
      where: { id: stopId },
      data,
    });
  }

  async removeStop(routeId: string, stopId: string, driverId: string) {
    await this.findById(routeId, driverId);
    await prisma.stop.delete({ where: { id: stopId } });
  }

  async reorderStops(routeId: string, driverId: string, stopIds: string[]) {
    await this.findById(routeId, driverId);
    const updates = stopIds.map((id, index) =>
      prisma.stop.update({ where: { id }, data: { order: index + 1 } })
    );
    await prisma.$transaction(updates);
    return prisma.stop.findMany({ where: { routeId }, orderBy: { order: 'asc' } });
  }
}

export const routesService = new RoutesService();
