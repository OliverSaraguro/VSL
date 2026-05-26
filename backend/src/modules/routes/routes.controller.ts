import { Response, NextFunction } from 'express';
import { routesService } from './routes.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

export class RoutesController {
  async today(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const route = await routesService.findTodayRoute(req.user!.userId);
      sendSuccess(res, route);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const route = await routesService.create(req.user!.userId, req.body);
      sendCreated(res, route, 'Ruta creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const routes = await routesService.findAllByDriver(req.user!.userId);
      sendSuccess(res, routes);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const route = await routesService.findById(req.params.id, req.user!.userId);
      sendSuccess(res, route);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const route = await routesService.update(req.params.id, req.user!.userId, req.body);
      sendSuccess(res, route, 'Ruta actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await routesService.delete(req.params.id, req.user!.userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async addStop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stop = await routesService.addStop(req.params.id, req.user!.userId, req.body);
      sendCreated(res, stop, 'Parada agregada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateStop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stop = await routesService.updateStop(
        req.params.id,
        req.params.stopId,
        req.user!.userId,
        req.body,
      );
      sendSuccess(res, stop, 'Parada actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async removeStop(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await routesService.removeStop(req.params.id, req.params.stopId, req.user!.userId);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }

  async reorderStops(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stops = await routesService.reorderStops(
        req.params.id,
        req.user!.userId,
        req.body.stopIds,
      );
      sendSuccess(res, stops, 'Paradas reordenadas exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

export const routesController = new RoutesController();
