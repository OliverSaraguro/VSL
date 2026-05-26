import { Router } from 'express';
import { routesController } from './routes.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { Role } from '../../shared/types';

const router = Router();

router.use(authenticate, authorize(Role.DRIVER));

router.get('/today', routesController.today);
router.get('/', routesController.findAll);
router.get('/:id', routesController.findById);
router.post('/', routesController.create);
router.patch('/:id', routesController.update);
router.delete('/:id', routesController.delete);

router.post('/:id/stops', routesController.addStop);
router.patch('/:id/stops/:stopId', routesController.updateStop);
router.delete('/:id/stops/:stopId', routesController.removeStop);
router.put('/:id/stops/reorder', routesController.reorderStops);

export default router;
