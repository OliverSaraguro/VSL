import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/auth.store';

// El id del usuario logueado ya vive en el store de autenticación. Usarlo en vez de volver a
// pedirlo a Supabase con supabase.auth.getUser() evita un round-trip de red innecesario y el
// deadlock conocido del lock interno de supabase-js en React Native.
function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Evita que una llamada a Supabase se quede colgada indefinidamente (p.ej. red inestable del emulador
// o caché de esquema de PostgREST desactualizado tras un alter table)
function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado en "${label}" (revisa tu conexión a internet)`));
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: number;
  amount: number;
  status: 'PAID' | 'PENDING';
  paidAt?: string;
  dueDate: string;
}

function mapPayment(db: any): PaymentRecord {
  return {
    id: db.id,
    studentId: db.student_id,
    studentName: db.student?.name ?? 'Estudiante',
    month: db.month,
    amount: db.amount,
    status: (db.status as string).toUpperCase() as 'PAID' | 'PENDING',
    paidAt: db.paid_at,
    dueDate: db.due_date,
  };
}

class PaymentsService {
  async getAll(month?: number): Promise<PaymentRecord[]> {
    if (!getCurrentUserId()) return [];

    // La tabla public.payments no tiene columna created_at; due_date es la que existe
    // y tiene sentido para ordenar (fecha de vencimiento del pago).
    let query = supabase
      .from('payments')
      .select('*, student:students(id, name)')
      .order('due_date', { ascending: false });

    if (month !== undefined) {
      query = query.eq('month', month);
    }

    const { data, error } = await withTimeout(query, 'cargar pagos');
    if (error) throw error;
    return (data || []).map(mapPayment);
  }

  async updateStatus(id: string, paid: boolean): Promise<void> {
    const { error } = await withTimeout(
      supabase
        .from('payments')
        .update({
          status: paid ? 'paid' : 'pending',
          paid_at: paid ? new Date().toISOString() : null,
        })
        .eq('id', id),
      'actualizar pago',
    );
    if (error) throw error;
  }
}

export default new PaymentsService();
