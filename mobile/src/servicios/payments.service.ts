import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/auth.store';

function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function withTimeout<T>(promise: PromiseLike<T>, label: string, ms = 15000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado en "${label}" (revisa tu conexión a internet)`));
    }, ms);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err)   => { clearTimeout(timer); reject(err); },
    );
  });
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: number;
  year: number;
  amount: number;
  status: 'PAID' | 'PENDING';
  paidAt?: string;
  dueDate: string;
  notes?: string;
}

function mapPayment(db: any): PaymentRecord {
  const due = db.due_date ? new Date(db.due_date) : new Date();
  return {
    id: db.id,
    studentId: db.student_id,
    studentName: db.student?.name ?? 'Estudiante',
    month: db.month ?? due.getMonth() + 1,
    year: db.year ?? due.getFullYear(),
    amount: db.amount,
    status: (db.status as string).toUpperCase() as 'PAID' | 'PENDING',
    paidAt: db.paid_at,
    dueDate: db.due_date,
    notes: db.notes,
  };
}

class PaymentsService {
  async getAll(month?: number): Promise<PaymentRecord[]> {
    if (!getCurrentUserId()) return [];
    let query = supabase
      .from('payments')
      .select('*, student:students(id, name)')
      .order('due_date', { ascending: false });
    if (month !== undefined) query = query.eq('month', month);
    const { data, error } = await withTimeout(query, 'cargar pagos');
    if (error) throw error;
    return (data || []).map(mapPayment);
  }

  async getByMonthYear(month: number, year: number): Promise<PaymentRecord[]> {
    const driverId = getCurrentUserId();
    if (!driverId) return [];
    const { data, error } = await withTimeout(
      supabase
        .from('payments')
        .select('*, student:students(id, name)')
        .eq('month', month)
        .eq('year', year)
        .order('due_date', { ascending: true }),
      'cargar pagos del mes',
    );
    if (error) throw error;
    return (data || []).map(mapPayment);
  }

  // Pagos pendientes de un estudiante cuya fecha de corte ya llegó o pasó (HU24: recordatorio al
  // padre). La política de RLS de "payments" permite al padre leer los pagos de sus hijos.
  async getOverduePendingForStudent(studentId: string): Promise<PaymentRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await withTimeout(
      supabase
        .from('payments')
        .select('*, student:students(id, name)')
        .eq('student_id', studentId)
        .eq('status', 'pending')
        .lte('due_date', today),
      'cargar pagos pendientes',
    );
    if (error) throw error;
    return (data || []).map(mapPayment);
  }

  // Crea el registro de la mensualidad de un estudiante si no existía, o lo actualiza si ya
  // existía para ese mes/año (gracias al unique constraint de la tabla). Esto es lo que permite
  // un botón simple de "Registrar Pago": elegir estudiante, mes y si ya canceló o no.
  async upsert(payload: {
    studentId: string;
    driverId: string;
    month: number;
    year: number;
    amount: number;
    status: 'PAID' | 'PENDING';
  }): Promise<void> {
    const dueDate = `${payload.year}-${String(payload.month).padStart(2, '0')}-05`;
    const { error } = await withTimeout(
      supabase.from('payments').upsert(
        {
          student_id: payload.studentId,
          driver_id: payload.driverId,
          month: payload.month,
          year: payload.year,
          amount: payload.amount,
          status: payload.status === 'PAID' ? 'paid' : 'pending',
          paid_at: payload.status === 'PAID' ? new Date().toISOString() : null,
          due_date: dueDate,
        },
        { onConflict: 'student_id,driver_id,month,year' },
      ),
      'registrar pago',
    );
    if (error) throw error;
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

  async create(payload: {
    studentId: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }): Promise<PaymentRecord> {
    const driverId = getCurrentUserId();
    if (!driverId) throw new Error('No autenticado');
    const date = new Date(payload.dueDate);
    const { data, error } = await withTimeout(
      supabase
        .from('payments')
        .insert({
          student_id: payload.studentId,
          driver_id: driverId,
          amount: payload.amount,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          due_date: payload.dueDate,
          status: 'pending',
          notes: payload.notes ?? null,
        })
        .select('*, student:students(id, name)')
        .single(),
      'crear pago',
    );
    if (error) throw error;
    return mapPayment(data);
  }

  async update(id: string, payload: {
    amount?: number;
    dueDate?: string;
    status?: 'PAID' | 'PENDING';
    notes?: string;
  }): Promise<void> {
    const updates: Record<string, unknown> = {};
    if (payload.amount !== undefined) updates.amount = payload.amount;
    if (payload.dueDate !== undefined) {
      const d = new Date(payload.dueDate);
      updates.due_date = payload.dueDate;
      updates.month = d.getMonth() + 1;
      updates.year = d.getFullYear();
    }
    if (payload.status !== undefined) {
      updates.status = payload.status.toLowerCase();
      updates.paid_at = payload.status === 'PAID' ? new Date().toISOString() : null;
    }
    if (payload.notes !== undefined) updates.notes = payload.notes;
    const { error } = await withTimeout(
      supabase.from('payments').update(updates).eq('id', id),
      'actualizar pago',
    );
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('payments').delete().eq('id', id),
      'eliminar pago',
    );
    if (error) throw error;
  }
}

export default new PaymentsService();
