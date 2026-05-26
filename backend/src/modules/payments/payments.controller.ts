import { Response, NextFunction } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

class PaymentsController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payments = await paymentsService.findAllByDriver(req.user!.userId);
      sendSuccess(res, payments);
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.markAsPaid(req.params.id, req.user!.userId);
      sendSuccess(res, payment, 'Pago registrado');
    } catch (error) {
      next(error);
    }
  }

  async markAsPending(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payment = await paymentsService.markAsPending(req.params.id, req.user!.userId);
      sendSuccess(res, payment, 'Pago marcado como pendiente');
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const summary = await paymentsService.getSummary(req.user!.userId);
      sendSuccess(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

export const paymentsController = new PaymentsController();
