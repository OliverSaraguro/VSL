import { prisma } from '../../config/database';
import { AppError } from '../../shared/types';

export class PaymentsService {
  async findAllByDriver(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) return [];

    return prisma.payment.findMany({
      where: { driverId: driver.id },
      include: { student: { select: { id: true, name: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async markAsPaid(paymentId: string, userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new AppError('Conductor no encontrado', 404);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment || payment.driverId !== driver.id) {
      throw new AppError('Pago no encontrado', 404);
    }

    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date() },
      include: { student: { select: { id: true, name: true } } },
    });
  }

  async markAsPending(paymentId: string, userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new AppError('Conductor no encontrado', 404);

    return prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PENDING', paidAt: null },
      include: { student: { select: { id: true, name: true } } },
    });
  }

  async getSummary(userId: string) {
    const driver = await prisma.driver.findUnique({ where: { userId } });
    if (!driver) return { total: 0, paid: 0, pending: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };

    const payments = await prisma.payment.findMany({
      where: { driverId: driver.id, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
    });

    const paid = payments.filter(p => p.status === 'PAID');
    const pending = payments.filter(p => p.status === 'PENDING');

    return {
      total: payments.length,
      paid: paid.length,
      pending: pending.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: paid.reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: pending.reduce((sum, p) => sum + p.amount, 0),
    };
  }
}

export const paymentsService = new PaymentsService();
