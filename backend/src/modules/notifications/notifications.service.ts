import admin from 'firebase-admin';
import { prisma } from '../../config/database';
import { AppError } from '../../shared/types';

interface CreateNotificationData {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

export class NotificationsService {
  async create(notification: CreateNotificationData) {
    const user = await prisma.user.findUnique({
      where: { id: notification.userId },
      select: { id: true, fcmToken: true },
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const created = await prisma.notification.create({
      data: {
        userId: notification.userId,
        title: notification.title,
        body: notification.body,
        type: notification.type,
        data: notification.data ?? undefined,
      },
    });

    if (user.fcmToken) {
      await this.sendPush(user.fcmToken, notification.title, notification.body, notification.data);
    }

    return created;
  }

  async sendToRoute(routeId: string, title: string, body: string, type: string) {
    const students = await prisma.student.findMany({
      where: { routeId, parentId: { not: null } },
      select: { parentId: true },
    });

    const parentIds = [...new Set(
      students.map((s) => s.parentId).filter((id): id is string => id !== null),
    )];

    const notifications = parentIds.map((parentId) =>
      this.create({ userId: parentId, title, body, type }),
    );

    return Promise.allSettled(notifications);
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Notificación no encontrada', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('No tienes acceso a esta notificación', 403);
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
      select: { id: true },
    });
  }

  private async sendPush(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data: data ? this.serializeData(data) : undefined,
      });
    } catch (error) {
      console.error('[PUSH] Error al enviar notificación:', error);
    }
  }

  private serializeData(data: Record<string, unknown>): Record<string, string> {
    const serialized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return serialized;
  }
}

export const notificationsService = new NotificationsService();
