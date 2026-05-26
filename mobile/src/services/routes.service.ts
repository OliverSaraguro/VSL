import { Route, Stop, Trip, PaginatedResponse } from '../types';
import apiService from './api.service';

class RoutesService {
  async getAll(params?: Record<string, unknown>): Promise<PaginatedResponse<Route>> {
    return apiService.getPaginated<Route>('/routes', params);
  }

  async getById(id: string): Promise<Route> {
    return apiService.get<Route>(`/routes/${id}`);
  }

  async create(payload: Partial<Route>): Promise<Route> {
    return apiService.post<Route>('/routes', payload);
  }

  async update(id: string, payload: Partial<Route>): Promise<Route> {
    return apiService.put<Route>(`/routes/${id}`, payload);
  }

  async delete(id: string): Promise<void> {
    return apiService.delete(`/routes/${id}`);
  }

  async getStops(routeId: string): Promise<Stop[]> {
    return apiService.get<Stop[]>(`/routes/${routeId}/stops`);
  }

  async addStop(routeId: string, payload: Partial<Stop>): Promise<Stop> {
    return apiService.post<Stop>(`/routes/${routeId}/stops`, payload);
  }

  async updateStop(routeId: string, stopId: string, payload: Partial<Stop>): Promise<Stop> {
    return apiService.put<Stop>(`/routes/${routeId}/stops/${stopId}`, payload);
  }

  async removeStop(routeId: string, stopId: string): Promise<void> {
    return apiService.delete(`/routes/${routeId}/stops/${stopId}`);
  }

  async getTodayRoute(): Promise<Route | null> {
    return apiService.get<Route | null>('/routes/today');
  }

  async getActiveTrip(): Promise<Trip | null> {
    return apiService.get<Trip | null>('/trips/active');
  }

  async startTrip(routeId: string): Promise<Trip> {
    return apiService.post<Trip>('/trips/start', { routeId });
  }

  async completeTrip(tripId: string): Promise<Trip> {
    return apiService.patch<Trip>(`/trips/${tripId}/complete`);
  }

  async pauseTrip(tripId: string): Promise<Trip> {
    return apiService.patch<Trip>(`/trips/${tripId}/pause`);
  }

  async resumeTrip(tripId: string): Promise<Trip> {
    return apiService.patch<Trip>(`/trips/${tripId}/resume`);
  }

  async getTripHistory(params?: Record<string, unknown>): Promise<PaginatedResponse<Trip>> {
    return apiService.getPaginated<Trip>('/trips', params);
  }
}

export default new RoutesService();
