import { useCallback } from 'react';
import {
  useAuthStore,
  selectIsDriver,
  selectIsParent,
  selectUserFullName,
} from '../store/auth.store';
import { UserRole } from '../types';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isDriver = useAuthStore(selectIsDriver);
  const isParent = useAuthStore(selectIsParent);
  const fullName = useAuthStore(selectUserFullName);

  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  const hasRole = useCallback(
    (role: UserRole) => user?.role === role,
    [user?.role],
  );

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    isHydrated,
    isDriver,
    isParent,
    fullName,
    login,
    logout,
    loadProfile,
    hasRole,
  };
}
