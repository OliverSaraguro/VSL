import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/environment';
import { errorHandler, notFoundHandler } from './shared/middleware/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import routesRoutes from './modules/routes/routes.routes';
import studentsRoutes from './modules/students/students.routes';
import trackingRoutes from './modules/tracking/tracking.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import paymentsRoutes from './modules/payments/payments.routes';

const app = express();

// ─── Seguridad y parsing ─────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.LOG_LEVEL));
}

// ─── Health check ────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rutas de la API ─────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);

// ─── 404 y error handler ────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
