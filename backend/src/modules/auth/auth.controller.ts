import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendCreated, sendSuccess } from '../../shared/utils/response';

export class AuthController {
  async registerDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerDriver(req.body);
      sendCreated(res, result, 'Conductor registrado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async registerParent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerParent(req.body);
      sendCreated(res, result, 'Padre de familia registrado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, 'Inicio de sesión exitoso');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: any, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user.userId);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
