import { supabase } from '../config/supabase';
import { AuthResponse, User, UserRole } from '../types';

interface LoginPayload {
  email: string;
  password: string;
}

// Evita que una llamada a Supabase se quede colgada indefinidamente (p.ej. red inestable del emulador)
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

class AuthService {
  // Iniciar sesión con correo y contraseña en Supabase Auth
  async login(payload: LoginPayload): Promise<AuthResponse> {
    console.log('[auth] login: signInWithPassword...');
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      }),
      'iniciar sesión',
    );
    console.log('[auth] login: signInWithPassword OK', { hasUser: !!authData?.user, authError });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo obtener el usuario');

    // Obtener los datos del perfil guardados en la tabla pública de users
    console.log('[auth] login: cargando perfil público...');
    const { data: profile, error: profileError } = await withTimeout(
      supabase.from('users').select('*').eq('id', authData.user.id).maybeSingle(),
      'cargar perfil',
    );
    console.log('[auth] login: perfil cargado', { profile, profileError });

    if (profileError) {
      throw new Error(`Error al cargar el perfil: ${profileError.message}`);
    }
    if (!profile) {
      throw new Error(`No se encontró perfil para este usuario (id: ${authData.user.id}). Verifica que el registro se completó correctamente.`);
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

  async registerDriver(payload: any): Promise<AuthResponse> {
    console.log('[auth] registerDriver: signUp...', payload.email);
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signUp({
        email: payload.email as string,
        password: payload.password as string,
      }),
      'crear cuenta',
    );
    console.log('[auth] registerDriver: signUp OK', { hasUser: !!authData?.user, authError });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al registrar conductor');

    const userId = authData.user.id;

    console.log('[auth] registerDriver: insert users...', userId);
    const { error: userError } = await withTimeout(
      supabase.from('users').insert({
        id: userId,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        role: 'DRIVER',
      }),
      'crear perfil de usuario',
    );
    console.log('[auth] registerDriver: insert users result', { userError });
    if (userError) throw new Error(`Error al crear perfil: ${userError.message}`);

    console.log('[auth] registerDriver: insert drivers...', userId);
    const { error: driverError } = await withTimeout(
      supabase.from('drivers').insert({
        id: userId,
        license_number: payload.licenseNumber,
        plate_number: payload.licensePlate,
        vehicle_model: payload.vehicleModel,
        vehicle_color: payload.vehicleColor,
      }),
      'guardar datos del vehículo',
    );
    console.log('[auth] registerDriver: insert drivers result', { driverError });
    if (driverError) throw new Error(`Error al guardar datos del vehículo: ${driverError.message}`);

    return {
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        role: UserRole.DRIVER,
      },
      token: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token,
    };
  }

  async registerParent(payload: any): Promise<AuthResponse> {
    console.log('[auth] registerParent: signUp...', payload.email);
    const { data: authData, error: authError } = await withTimeout(
      supabase.auth.signUp({
        email: payload.email as string,
        password: payload.password as string,
      }),
      'crear cuenta',
    );
    console.log('[auth] registerParent: signUp OK', { hasUser: !!authData?.user, authError });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al registrar padre');

    const userId = authData.user.id;
    // Este campo solo identifica el registro en public.parents; el vínculo real con el
    // estudiante lo hace redeem_invitation_code() con el código que ingresó el padre.
    const parentRecordId = `PARENT-${userId.slice(0, 8).toUpperCase()}`;

    console.log('[auth] registerParent: insert users...', userId);
    const { error: userError } = await withTimeout(
      supabase.from('users').insert({
        id: userId,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        role: 'PARENT',
      }),
      'crear perfil de usuario',
    );
    console.log('[auth] registerParent: insert users result', { userError });
    if (userError) throw new Error(`Error al crear perfil: ${userError.message}`);

    console.log('[auth] registerParent: insert parents...', userId);
    const { error: parentError } = await withTimeout(
      supabase.from('parents').insert({
        id: userId,
        invitation_code: parentRecordId,
      }),
      'guardar datos del padre',
    );
    console.log('[auth] registerParent: insert parents result', { parentError });
    if (parentError) throw new Error(`Error al guardar datos del padre: ${parentError.message}`);

    // Canjear el código de invitación del ESTUDIANTE (el que dio el conductor) para vincular
    // a este padre con el niño correcto. Si falla (código inválido/expirado), la cuenta ya quedó
    // creada: se lo informamos al padre para que lo intente de nuevo desde su perfil.
    let linkWarning: string | undefined;
    if (payload.invitationCode && payload.invitationCode.trim()) {
      try {
        const { error: redeemError } = await withTimeout(
          supabase.rpc('redeem_invitation_code', {
            code: payload.invitationCode.trim().toUpperCase(),
          }),
          'vincular código de invitación',
        );
        if (redeemError) throw new Error(redeemError.message);
      } catch (err: any) {
        linkWarning = err?.message || 'No se pudo vincular el código de invitación.';
      }
    }

    return {
      user: {
        id: userId,
        email: payload.email,
        name: payload.name,
        phone: payload.phone,
        role: UserRole.PARENT,
      },
      token: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token,
      linkWarning,
    } as AuthResponse & { linkWarning?: string };
  }

  // Actualiza la foto de perfil propia (conductor o padre de familia). La RLS de "users" ya
  // permite a cualquier usuario actualizar su propia fila (auth.uid() = id).
  async updatePhoto(userId: string, photoUrl: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('users').update({ photo_url: photoUrl }).eq('id', userId),
      'actualizar foto de perfil',
    );
    if (error) throw new Error(`No se pudo guardar la foto de perfil: ${error.message}`);
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Obtener el perfil del usuario autenticado actual
  async getProfile(): Promise<User> {
    const { data: { user: authUser }, error: authError } = await withTimeout(
      supabase.auth.getUser(),
      'verificar sesión',
    );
    if (authError || !authUser) throw new Error('No hay usuario autenticado');

    const { data: profile, error: profileError } = await withTimeout(
      supabase.from('users').select('*').eq('id', authUser.id).single(),
      'cargar perfil',
    );

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
    const { data: { session } } = await withTimeout(supabase.auth.getSession(), 'obtener sesión');
    return session?.access_token || null;
  }
}

const authService = new AuthService();
export { authService };
export default authService;
