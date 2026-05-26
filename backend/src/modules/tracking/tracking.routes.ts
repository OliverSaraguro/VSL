import { Router } from 'express';
import { trackingController } from './tracking.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { Role } from '../../shared/types';

const router = Router();

router.use(authenticate);

router.post(
  '/trips/start',
  authorize(Role.DRIVER),
  trackingController.startTrip,
);

router.patch(
  '/trips/:id/pause',
  authorize(Role.DRIVER),
  trackingController.pauseTrip,
);

router.patch(
  '/trips/:id/resume',
  authorize(Role.DRIVER),
  trackingController.resumeTrip,
);

router.patch(
  '/trips/:id/finish',
  authorize(Role.DRIVER),
  trackingController.finishTrip,
);

router.get(
  '/trips/history',
  authorize(Role.DRIVER),
  trackingController.getTripHistory,
);

router.get(
  '/trips/active',
  authorize(Role.PARENT),
  trackingController.getActiveTrip,
);

export default router;
