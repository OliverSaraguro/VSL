import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    studentId: z.string().uuid('ID de estudiante inválido'),
    amount: z.number().positive('El monto debe ser positivo'),
    month: z.number().int().min(1).max(12, 'Mes inválido (1-12)'),
    year: z.number().int().min(2024).max(2100),
    description: z.string().optional(),
  }),
});

export const registerPaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de pago inválido'),
  }),
  body: z.object({
    receiptUrl: z.string().url('URL de comprobante inválida').optional(),
  }),
});

export const paymentIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID de pago inválido'),
  }),
});

export const paymentQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'PAID', 'OVERDUE']).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2024).max(2100).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>['body'];
