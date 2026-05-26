import { Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export class NotificationsController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await notificationsService.findByUser(req.user!.userId, page, limit);
      sendSuccess(
        res,
        { notifications: result.notifications, unreadCount: result.unreadCount },
        'Notificaciones obtenidas',
        200,
        result.meta,
      );
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const notification = await notificationsService.markAsRead(
        req.params.id,
        req.user!.userId,
      );
      sendSuccess(res, notification, 'Notificación marcada como leída');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await notificationsService.markAllAsRead(req.user!.userId);
      sendSuccess(res, { updated: result.count }, 'Todas las notificaciones marcadas como leídas');
    } catch (error) {
      next(error);
    }
  }

  async updateFcmToken(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await notificationsService.updateFcmToken(req.user!.userId, req.body.fcmToken);
      sendSuccess(res, null, 'Token FCM actualizado');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationsController = new NotificationsController();
