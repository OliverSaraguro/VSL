import { Response, NextFunction } from 'express';
import { trackingService } from './tracking.service';
import { sendSuccess, sendCreated } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export class TrackingController {
  async startTrip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await trackingService.startTrip(req.user!.userId, req.body.routeId);
      sendCreated(res, trip, 'Viaje iniciado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async pauseTrip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await trackingService.pauseTrip(req.params.id, req.user!.userId);
      sendSuccess(res, trip, 'Viaje pausado');
    } catch (error) {
      next(error);
    }
  }

  async resumeTrip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await trackingService.resumeTrip(req.params.id, req.user!.userId);
      sendSuccess(res, trip, 'Viaje reanudado');
    } catch (error) {
      next(error);
    }
  }

  async finishTrip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await trackingService.finishTrip(req.params.id, req.user!.userId);
      sendSuccess(res, trip, 'Viaje finalizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async getTripHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await trackingService.getTripHistory(req.user!.userId, page, limit);
      sendSuccess(res, result.trips, 'Historial de viajes', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getActiveTrip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await trackingService.getActiveTripForParent(req.user!.userId);
      sendSuccess(res, trip, trip ? 'Viaje activo encontrado' : 'No hay viajes activos');
    } catch (error) {
      next(error);
    }
  }
}

export const trackingController = new TrackingController();
