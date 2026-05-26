import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types';
import { sendError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  console.error('[ERROR]', err);

  const statusCode = 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message;

  sendError(res, message, statusCode);
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 'Recurso no encontrado', 404);
}
