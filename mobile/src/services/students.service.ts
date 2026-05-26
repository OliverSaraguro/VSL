import { Student, Absence, PaginatedResponse } from '../types';
import apiService from './api.service';

class StudentsService {
  async getAll(): Promise<Student[]> {
    return apiService.get<Student[]>('/students');
  }

  async getById(id: string): Promise<Student> {
    return apiService.get<Student>(`/students/${id}`);
  }

  async create(payload: Partial<Student>): Promise<Student> {
    return apiService.post<Student>('/students', payload);
  }

  async update(id: string, payload: Partial<Student>): Promise<Student> {
    return apiService.put<Student>(`/students/${id}`, payload);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete(`/students/${id}`);
  }

  async getByRoute(routeId: string): Promise<Student[]> {
    return apiService.get<Student[]>(`/routes/${routeId}/students`);
  }

  async getByParent(parentId: string): Promise<Student[]> {
    return apiService.get<Student[]>(`/parents/${parentId}/students`);
  }

  async reportAbsence(payload: {
    studentId: string;
    date: string;
    reason: string;
  }): Promise<Absence> {
    return apiService.post<Absence>('/absences', payload);
  }

  async getAbsences(
    studentId: string,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<Absence>> {
    return apiService.getPaginated<Absence>(`/students/${studentId}/absences`, params);
  }

  async cancelAbsence(absenceId: string): Promise<void> {
    return apiService.delete(`/absences/${absenceId}`);
  }
}

export default new StudentsService();
