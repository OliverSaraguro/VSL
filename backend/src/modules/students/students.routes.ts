import { Router } from 'express';
import { studentsController } from './students.controller';
import { authenticate, authorize } from '../../shared/middleware/auth.middleware';
import { Role } from '../../shared/types';

const router = Router();

router.use(authenticate);

router.get('/', studentsController.findAll);
router.get('/:id', studentsController.findById);
router.post('/', authorize(Role.DRIVER), studentsController.create);
router.patch('/:id', authorize(Role.DRIVER), studentsController.update);
router.delete('/:id', authorize(Role.DRIVER), studentsController.delete);

export default router;
