import { supabase } from '../config/supabase';
import { AuthResponse, User, UserRole } from '../types';

interface LoginPayload {
  email: string;
  password: string;
}

class AuthService {
  // Iniciar sesión con correo y contraseña en Supabase Auth
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo obtener el usuario');

    // Obtener los datos del perfil guardados en la tabla pública de users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      throw new Error(`Error al cargar el perfil de usuario: ${profileError.message}`);
    }

    const user: User = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role as UserRole,
      photoUrl: profile.photo_url,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return {
      user,
      token: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token || '',
    };
  }

  // Registrar un conductor en Supabase Auth (el trigger de DB creará las filas en public)
  async registerDriver(payload: any): Promise<AuthResponse> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email as string,
      password: payload.password as string,
      options: {
        data: {
          role: 'DRIVER',
          name: payload.name,
          phone: payload.phone,
          licenseNumber: payload.licenseNumber,
          licensePlate: payload.licensePlate,
          vehicleModel: payload.vehicleModel,
          vehicleColor: payload.vehicleColor,
          licenseExpiry: payload.licenseExpiry,
          vehicleBrand: payload.vehicleBrand,
          vehicleYear: payload.vehicleYear,
          vehicleCapacity: payload.vehicleCapacity,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al registrar conductor');

    // Si la sesión se inicia de inmediato (confirmación de email desactivada)
    if (authData.session) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return {
        user: profile
          ? {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
              role: profile.role as UserRole,
              photoUrl: profile.photo_url,
              isActive: profile.is_active,
            }
          : {
              id: authData.user.id,
              email: authData.user.email || '',
              name: (authData.user.user_metadata?.name as string) || '',
              role: UserRole.DRIVER,
            },
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      };
    }

    // Si requiere confirmación por email
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        name: (authData.user.user_metadata?.name as string) || '',
        role: UserRole.DRIVER,
      },
      token: '',
    };
  }

  // Registrar un padre en Supabase Auth
  async registerParent(payload: any): Promise<AuthResponse> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: payload.email as string,
      password: payload.password as string,
      options: {
        data: {
          role: 'PARENT',
          name: payload.name,
          phone: payload.phone,
          invitationCode: payload.invitationCode,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al registrar padre');

    if (authData.session) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return {
        user: profile
          ? {
              id: profile.id,
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
              role: profile.role as UserRole,
              photoUrl: profile.photo_url,
              isActive: profile.is_active,
            }
          : {
              id: authData.user.id,
              email: authData.user.email || '',
              name: (authData.user.user_metadata?.name as string) || '',
              role: UserRole.PARENT,
            },
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      };
    }

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email || '',
        name: (authData.user.user_metadata?.name as string) || '',
        role: UserRole.PARENT,
      },
      token: '',
    };
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Obtener el perfil del usuario autenticado actual
  async getProfile(): Promise<User> {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error('No hay usuario autenticado');

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      throw new Error(`Error al recuperar perfil público: ${profileError.message}`);
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role as UserRole,
      photoUrl: profile.photo_url,
      isActive: profile.is_active,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  // Obtener el token de sesión guardado
  async getStoredToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }
}

const authService = new AuthService();
export { authService };
export default authService;
