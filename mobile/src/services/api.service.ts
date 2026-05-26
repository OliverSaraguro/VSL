import { AxiosRequestConfig } from 'axios';
import apiClient from '../config/api';
import { PaginatedResponse } from '../types';

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

class ApiService {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await apiClient.get<BackendResponse<T>>(url, config);
    return data.data;
  }

  async getPaginated<T>(
    url: string,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<T>> {
    const { data } = await apiClient.get<BackendResponse<PaginatedResponse<T>>>(url, { params });
    return data.data;
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await apiClient.post<BackendResponse<T>>(url, body, config);
    return data.data;
  }

  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await apiClient.put<BackendResponse<T>>(url, body, config);
    return data.data;
  }

  async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await apiClient.patch<BackendResponse<T>>(url, body, config);
    return data.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await apiClient.delete<BackendResponse<T>>(url, config);
    return data.data;
  }
}

export default new ApiService();
