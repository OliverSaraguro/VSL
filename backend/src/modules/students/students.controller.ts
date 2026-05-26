import { Response, NextFunction } from 'express';
import { studentsService } from './students.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../shared/utils/response';
import { AuthRequest } from '../../shared/types';

class StudentsController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const students = await studentsService.findAllByDriver(req.user!.userId);
      sendSuccess(res, students);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await studentsService.findById(req.params.id);
      sendSuccess(res, student);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await studentsService.create(req.user!.userId, req.body);
      sendCreated(res, student, 'Estudiante registrado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const student = await studentsService.update(req.params.id, req.body);
      sendSuccess(res, student, 'Estudiante actualizado');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await studentsService.delete(req.params.id);
      sendNoContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const studentsController = new StudentsController();
