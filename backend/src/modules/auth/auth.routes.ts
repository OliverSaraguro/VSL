import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/auth.middleware';
import { validate } from '../../shared/middleware/validation.middleware';
import {
  registerDriverSchema,
  registerParentSchema,
  loginSchema,
} from './auth.validation';

const router = Router();

router.post(
  '/register/driver',
  validate(registerDriverSchema),
  authController.registerDriver,
);

router.post(
  '/register/parent',
  validate(registerParentSchema),
  authController.registerParent,
);

router.post(
  '/login',
  validate(loginSchema),
  authController.login,
);

router.get('/profile', authenticate, authController.getProfile);

export default router;
