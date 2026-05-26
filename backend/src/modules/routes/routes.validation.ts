import { z } from 'zod';

export const createRouteSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    description: z.string().optional(),
  }),
});

export const updateRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ruta inválido'),
  }),
  body: z.object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const addStopSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ruta inválido'),
  }),
  body: z.object({
    name: z.string().min(2, 'El nombre de la parada debe tener al menos 2 caracteres'),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    order: z.number().int().min(0).optional(),
  }),
});

export const updateStopSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ruta inválido'),
    stopId: z.string().uuid('ID de parada inválido'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    order: z.number().int().min(0).optional(),
  }),
});

export const routeIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de ruta inválido'),
  }),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>['body'];
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>['body'];
export type AddStopInput = z.infer<typeof addStopSchema>['body'];
export type UpdateStopInput = z.infer<typeof updateStopSchema>['body'];
