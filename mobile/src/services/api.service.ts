import { supabase } from '../config/supabase';
import authService from './auth.service';
import notificationsService from './notifications.service';

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class ApiService {
  async get<T>(url: string, config?: any): Promise<T> {
    if (url === '/auth/profile') {
      return (await authService.getProfile()) as unknown as T;
    }
    
    if (url === '/notifications') {
      const result = await notificationsService.getAll({ limit: 10 });
      return result.data as unknown as T;
    }

    if (url === '/payments') {
      // Consultar pagos desde Supabase
      const { data, error } = await supabase
        .from('payments')
        .select('*, student:students(name)');
      
      if (error) throw error;

      // Mapear al formato esperado por el frontend
      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        month: p.month,
        amount: p.amount,
        status: p.status.toUpperCase(), // 'PAID' o 'PENDING'
        student: {
          name: p.student?.name || 'Estudiante',
        },
      }));
      return mapped as unknown as T;
    }

    return [] as unknown as T;
  }

  async getPaginated<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<any> {
    if (url === '/notifications') {
      return notificationsService.getAll(params);
    }
    return { data: [], total: 0 };
  }

  async post<T>(url: string, body?: unknown, config?: any): Promise<T> {
    return {} as T;
  }

  async put<T>(url: string, body?: unknown, config?: any): Promise<T> {
    return {} as T;
  }

  async patch<T>(url: string, body?: unknown, config?: any): Promise<T> {
    if (url.includes('/notifications/') && url.endsWith('/read')) {
      const id = url.split('/')[2];
      return (await notificationsService.markAsRead(id)) as unknown as T;
    }
    return {} as T;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    return {} as T;
  }
}

export default new ApiService();
