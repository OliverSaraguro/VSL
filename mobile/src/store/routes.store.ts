import { create } from 'zustand';
import { Route, Trip, Student, TripStatus } from '../types';
import routesService from '../servicios/routes.service';
import studentsService from '../servicios/students.service';

interface RoutesState {
  routes: Route[];
  todayRoute: Route | null;
  activeTrip: Trip | null;
  students: Student[];
  isLoading: boolean;
  error: string | null;

  fetchRoutes: () => Promise<void>;
  fetchTodayRoute: () => Promise<void>;
  fetchActiveTrip: () => Promise<void>;
  fetchStudentsByRoute: (routeId: string) => Promise<void>;
  startTrip: (routeId: string) => Promise<void>;
  completeTrip: () => Promise<void>;
  pauseTrip: () => Promise<void>;
  resumeTrip: () => Promise<void>;
  updateTripLocation: (latitude: number, longitude: number) => void;
  clearError: () => void;
}

export const useRoutesStore = create<RoutesState>((set, get) => ({
  routes: [],
  todayRoute: null,
  activeTrip: null,
  students: [],
  isLoading: false,
  error: null,

  fetchRoutes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await routesService.getAll();
      set({ routes: response.data, isLoading: false });
    } catch (err) {
      console.error('[routes.store] fetchRoutes', err);
      set({ routes: [], isLoading: false });
    }
  },

  fetchTodayRoute: async () => {
    set({ isLoading: true, error: null });
    try {
      const route = await routesService.getTodayRoute();
      set({ todayRoute: route, isLoading: false });
    } catch (err) {
      console.error('[routes.store] fetchTodayRoute', err);
      set({ todayRoute: null, isLoading: false });
    }
  },

  fetchActiveTrip: async () => {
    set({ isLoading: true, error: null });
    try {
      const trip = await routesService.getActiveTrip();
      set({ activeTrip: trip, isLoading: false });
    } catch (err) {
      console.error('[routes.store] fetchActiveTrip', err);
      set({ activeTrip: null, isLoading: false });
    }
  },

  fetchStudentsByRoute: async (routeId) => {
    set({ isLoading: true, error: null });
    try {
      const students = await studentsService.getByRoute(routeId);
      set({ students, isLoading: false });
    } catch (err) {
      console.error('[routes.store] fetchStudentsByRoute', err);
      set({ students: [], isLoading: false });
    }
  },

  startTrip: async (routeId) => {
    set({ isLoading: true, error: null });
    try {
      const trip = await routesService.startTrip(routeId);
      set({ activeTrip: trip, isLoading: false });
    } catch {
      set({ error: 'Error al iniciar viaje', isLoading: false });
    }
  },

  completeTrip: async () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    set({ isLoading: true, error: null });
    try {
      const trip = await routesService.completeTrip(activeTrip.id);
      set({ activeTrip: trip, isLoading: false });
    } catch {
      set({ error: 'Error al completar viaje', isLoading: false });
    }
  },

  pauseTrip: async () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    set({ isLoading: true, error: null });
    try {
      const trip = await routesService.pauseTrip(activeTrip.id);
      set({ activeTrip: trip, isLoading: false });
    } catch {
      set({ error: 'Error al pausar viaje', isLoading: false });
    }
  },

  resumeTrip: async () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    set({ isLoading: true, error: null });
    try {
      const trip = await routesService.resumeTrip(activeTrip.id);
      set({ activeTrip: trip, isLoading: false });
    } catch {
      set({ error: 'Error al reanudar viaje', isLoading: false });
    }
  },

  updateTripLocation: (latitude, longitude) => {
    const { activeTrip } = get();
    if (!activeTrip || activeTrip.status !== TripStatus.IN_PROGRESS) return;
    set({
      activeTrip: { ...activeTrip, currentLatitude: latitude, currentLongitude: longitude },
    });
  },

  clearError: () => set({ error: null }),
}));
