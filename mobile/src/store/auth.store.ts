import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import authService from '../servicios/auth.service';
import notificationsService from '../servicios/notifications.service';
import { supabase } from '../config/supabase';

// HU09/HU14/HU15/...: registra el push token apenas hay sesión, sin bloquear ni romper el login
// si el usuario rechaza el permiso o no hay push remoto disponible (p.ej. en Expo Go).
function registerPushTokenSilently() {
  notificationsService.registerPushToken().catch(() => {});
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
  setHydrated: () => void;
  syncSession: () => Promise<void>;
  setPhotoUrl: (photoUrl: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: true,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      loadProfile: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        }
      },

      setHydrated: () => set({ isHydrated: true }),

      // Refleja la nueva foto de perfil de inmediato en toda la app (el guardado en Supabase ya
      // se hizo antes de llamar a esto, ver authService.updatePhoto).
      setPhotoUrl: (photoUrl) => {
        const { user } = get();
        if (!user) return;
        set({ user: { ...user, photoUrl } });
      },

      syncSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              set({
                user: {
                  id: profile.id,
                  email: profile.email,
                  name: profile.name,
                  phone: profile.phone,
                  role: profile.role as UserRole,
                  photoUrl: profile.photo_url,
                  isActive: profile.is_active,
                  createdAt: profile.created_at,
                  updatedAt: profile.updated_at,
                },
                token: session.access_token,
                isAuthenticated: true,
              });
              registerPushTokenSilently();
            }
          } catch {
            // Ignorar errores al recuperar perfil para no interrumpir
          }
        }
        set({ isHydrated: true });
      }
    }),
    {
      name: '@vsl/auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Ejecutar sincronización con Supabase una vez hidratado el almacén
        state?.syncSession();
      },
    },
  ),
);

// Escuchar cambios de autenticación en Supabase en segundo plano
//
// IMPORTANTE: supabase-js mantiene un candado interno mientras procesa este callback. Si aquí
// mismo (de forma síncrona/await directo) se llama a otro método de supabase (p.ej. supabase.from(...)),
// esa llamada espera el mismo candado y la app queda colgada para siempre en TODAS las consultas
// futuras (es un deadlock documentado por Supabase). Por eso el trabajo async se difiere con
// setTimeout(..., 0): así corre después de que el callback termine y libere el candado.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session?.user) {
      setTimeout(async () => {
        try {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            useAuthStore.setState({
              user: {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                phone: profile.phone,
                role: profile.role as UserRole,
                photoUrl: profile.photo_url,
                isActive: profile.is_active,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              },
              token: session.access_token,
              isAuthenticated: true,
              isLoading: false,
            });
            registerPushTokenSilently();
          }
        } catch {
          // En caso de error, mantener lo que haya o esperar reintentar
        }
      }, 0);
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }
});

export const selectIsDriver = (state: AuthState) =>
  state.user?.role === UserRole.DRIVER;

export const selectIsParent = (state: AuthState) =>
  state.user?.role === UserRole.PARENT;

export const selectUserFullName = (state: AuthState) =>
  state.user?.name ?? '';
