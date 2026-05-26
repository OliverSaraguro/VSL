import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { Role } from '../../shared/types';

const router = Router();

router.use(authenticate, authorize(Role.DRIVER));

router.get('/', paymentsController.findAll);
router.get('/summary', paymentsController.getSummary);
router.patch('/:id/pay', paymentsController.markAsPaid);
router.patch('/:id/pending', paymentsController.markAsPending);

export default router;
