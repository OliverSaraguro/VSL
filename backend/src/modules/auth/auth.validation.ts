import { z } from 'zod';

export const registerDriverSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'Teléfono inválido').optional(),
    plateNumber: z.string().min(3, 'Placa requerida'),
    licenseNumber: z.string().min(5, 'Número de licencia inválido'),
    vehicleModel: z.string().min(2, 'Modelo de vehículo requerido'),
    vehicleColor: z.string().min(2, 'Color de vehículo requerido'),
  }),
});

export const registerParentSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    phone: z.string().min(10, 'Teléfono inválido').optional(),
    invitationCode: z.string().min(1, 'Código de invitación requerido'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
  }),
});

export type RegisterDriverInput = z.infer<typeof registerDriverSchema>['body'];
export type RegisterParentInput = z.infer<typeof registerParentSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
