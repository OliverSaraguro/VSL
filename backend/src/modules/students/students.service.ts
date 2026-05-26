import { prisma } from '../../config/database';
import { AppError } from '../../shared/types';

export class StudentsService {
  async findAllByDriver(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) return [];

    return prisma.student.findMany({
      where: { driverId: driver.id },
      include: { parent: { include: { user: { select: { name: true, phone: true } } } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        parent: { include: { user: { select: { name: true, phone: true, email: true } } } },
        stops: { include: { route: { select: { id: true, name: true } } } },
      },
    });
    if (!student) throw new AppError('Estudiante no encontrado', 404);
    return student;
  }

  async create(userId: string, data: { name: string; address: string; latitude: number; longitude: number }) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new AppError('Conductor no encontrado', 404);

    return prisma.student.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        driverId: driver.id,
      },
    });
  }

  async update(id: string, data: { name?: string; address?: string; isActive?: boolean }) {
    return prisma.student.update({ where: { id }, data });
  }

  async delete(id: string) {
    await prisma.student.delete({ where: { id } });
  }
}

export const studentsService = new StudentsService();
