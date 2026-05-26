import { z } from 'zod';

export const registerStudentSchema = z.object({
  body: z.object({
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    grade: z.string().optional(),
    school: z.string().optional(),
    routeId: z.string().uuid('ID de ruta inválido'),
  }),
});

export const updateStudentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de estudiante inválido'),
  }),
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    grade: z.string().optional(),
    school: z.string().optional(),
    routeId: z.string().uuid('ID de ruta inválido').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const studentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de estudiante inválido'),
  }),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>['body'];
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>['body'];
