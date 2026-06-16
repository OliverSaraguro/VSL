import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/auth.store';
import { Student, Absence, PaginatedResponse } from '../types';

// El id del usuario logueado ya vive en el store de autenticación. Usarlo en vez de volver a
// pedirlo a Supabase con supabase.auth.getUser() evita un round-trip de red innecesario y el
// deadlock conocido del lock interno de supabase-js en React Native.
function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

// Evita que una llamada a Supabase se quede colgada indefinidamente (p.ej. red inestable del emulador
// o caché de esquema de PostgREST desactualizado tras un alter table)
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

// Mapeadores para traducir snake_case (Postgres) a camelCase (TypeScript/UI)
function mapStudent(db: any): Student {
  return {
    id: db.id,
    name: db.name,
    address: db.address,
    latitude: db.latitude,
    longitude: db.longitude,
    photoUrl: db.photo_url,
    driverId: db.driver_id,
    parentId: db.parent_id,
    isActive: db.is_active,
    createdAt: db.created_at,
    invitationCode: db.invitation_code,
    invitationCodeExpiresAt: db.invitation_code_expires_at,
  };
}

// Código corto y fácil de dictar/escribir por WhatsApp (sin caracteres ambiguos como 0/O o 1/I)
function generateInvitationCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `VSL-${code.slice(0, 4)}-${code.slice(4)}`;
}

function mapAbsence(db: any): Absence {
  return {
    id: db.id,
    studentId: db.student_id,
    date: db.date,
    reason: db.reason,
    reportedBy: db.registered_by,
    createdAt: db.created_at,
    student: db.student ? mapStudent(db.student) : undefined,
  };
}

class StudentsService {
  async getAll(): Promise<Student[]> {
    console.log('[students] getAll: consultando...');
    const { data, error } = await withTimeout(
      supabase.from('students').select('*').eq('is_active', true),
      'cargar estudiantes',
    );
    console.log('[students] getAll: consulta OK', { count: data?.length, error });

    if (error) throw error;
    return (data || []).map(mapStudent);
  }

  async getById(id: string): Promise<Student> {
    const { data, error } = await withTimeout(
      supabase.from('students').select('*').eq('id', id).single(),
      'cargar estudiante',
    );

    if (error) throw error;
    return mapStudent(data);
  }

  async create(payload: any): Promise<Student> {
    // 1. Obtener el ID del conductor actualmente autenticado (ya disponible en el store local,
    // evitamos volver a pedírselo a Supabase con getUser())
    const driverId = getCurrentUserId();
    if (!driverId) throw new Error('Conductor no autenticado. Inicia sesión de nuevo.');

    // 2. Intentar buscar el ID del padre si se ingresó un correo de una cuenta YA registrada
    let parentId: string | null = null;
    if (payload.parentEmail && payload.parentEmail.trim()) {
      try {
        const { data: parentUser } = await withTimeout(
          supabase
            .from('users')
            .select('id')
            .eq('email', payload.parentEmail.trim().toLowerCase())
            .eq('role', 'PARENT')
            .maybeSingle(),
          'buscar padre',
        );

        if (parentUser) {
          parentId = parentUser.id;
        }
      } catch {
        // Ignorar si no se encuentra o hay error en la búsqueda
      }
    }

    // 3. Si todavía no hay un padre vinculado (lo más común: el padre aún no tiene cuenta),
    // generamos un código de invitación válido por 48h para que el conductor se lo comparta
    // por WhatsApp/SMS y el padre lo use al registrarse (HU02 / HU06).
    const invitationCode = parentId ? null : generateInvitationCode();
    const invitationCodeExpiresAt = parentId
      ? null
      : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 4. Insertar en Supabase
    const { data, error } = await withTimeout(
      supabase
        .from('students')
        .insert({
          name: payload.name,
          photo_url: payload.photoUrl || null,
          address: payload.address,
          latitude: payload.latitude ?? -3.99313, // Centro de Loja (coordenadas por defecto)
          longitude: payload.longitude ?? -79.20456,
          is_active: payload.isActive ?? true,
          driver_id: driverId, // Asignar el ID del conductor logueado
          parent_id: parentId, // Vincular al padre si ya tenía cuenta con ese correo
          invitation_code: invitationCode,
          invitation_code_expires_at: invitationCodeExpiresAt,
        })
        .select()
        .single(),
      'crear estudiante',
    );

    if (error) throw error;
    return mapStudent(data);
  }

  // Regenera el código de invitación de un estudiante (p. ej. si el anterior expiró sin usarse)
  async regenerateInvitationCode(studentId: string): Promise<Student> {
    const invitationCode = generateInvitationCode();
    const invitationCodeExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await withTimeout(
      supabase
        .from('students')
        .update({
          invitation_code: invitationCode,
          invitation_code_expires_at: invitationCodeExpiresAt,
        })
        .eq('id', studentId)
        .select()
        .single(),
      'generar nuevo código de invitación',
    );

    if (error) throw error;
    return mapStudent(data);
  }

  // Vincula al padre autenticado con el estudiante dueño del código (HU02). Usa una función de
  // Postgres con privilegios elevados porque el padre aún no tiene permiso de RLS para leer la
  // fila del estudiante antes de quedar vinculado.
  async redeemInvitationCode(code: string): Promise<Student> {
    const { data, error } = await withTimeout(
      supabase.rpc('redeem_invitation_code', { code: code.trim().toUpperCase() }),
      'vincular código de invitación',
    );

    if (error) throw new Error(error.message);
    return mapStudent(data);
  }

  async update(id: string, payload: Partial<Student>): Promise<Student> {
    const { data, error } = await withTimeout(
      supabase
        .from('students')
        .update({
          name: payload.name,
          photo_url: payload.photoUrl,
          address: payload.address,
          latitude: payload.latitude,
          longitude: payload.longitude,
          is_active: payload.isActive,
          driver_id: payload.driverId,
          parent_id: payload.parentId,
        })
        .eq('id', id)
        .select()
        .single(),
      'actualizar estudiante',
    );

    if (error) throw error;
    return mapStudent(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('students').delete().eq('id', id),
      'eliminar estudiante',
    );

    if (error) throw error;
  }

  async getByRoute(routeId: string): Promise<Student[]> {
    // En Supabase un estudiante está asociado a una ruta mediante las paradas de la ruta.
    // Consultamos los estudiantes que tienen paradas en dicha ruta.
    const { data, error } = await withTimeout(
      supabase.from('stops').select('student:students(*)').eq('route_id', routeId),
      'cargar estudiantes de la ruta',
    );

    if (error) throw error;

    const students = (data || [])
      .map((item: any) => item.student)
      .filter(Boolean);

    return students.map(mapStudent);
  }

  async getByParent(parentId: string): Promise<Student[]> {
    const { data, error } = await withTimeout(
      supabase.from('students').select('*').eq('parent_id', parentId),
      'cargar estudiantes del padre',
    );

    if (error) throw error;
    return (data || []).map(mapStudent);
  }

  async reportAbsence(payload: Record<string, unknown>): Promise<Absence> {
    const { data, error } = await withTimeout(
      supabase
        .from('absences')
        .insert({
          student_id: payload.studentId,
          registered_by: payload.registeredBy,
          date: payload.date,
          reason: payload.reason,
        })
        .select()
        .single(),
      'reportar ausencia',
    );

    if (error) throw error;
    return mapAbsence(data);
  }

  async getAbsences(
    studentId: string,
    params?: Record<string, unknown>,
  ): Promise<PaginatedResponse<Absence>> {
    const limit = (params?.limit as number) || 10;
    const page = (params?.page as number) || 1;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await withTimeout(
      supabase
        .from('absences')
        .select('*, student:students(*)', { count: 'exact' })
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .range(from, to),
      'cargar ausencias',
    );

    if (error) throw error;

    const items = (data || []).map(mapAbsence);
    const total = count || 0;

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Devuelve el conjunto de IDs de estudiantes ausentes en una fecha dada (HU18: la parada del
  // estudiante ausente se quita de la lista activa del conductor ese día).
  async getAbsentStudentIds(studentIds: string[], date: string): Promise<Set<string>> {
    if (studentIds.length === 0) return new Set();

    const { data, error } = await withTimeout(
      supabase
        .from('absences')
        .select('student_id')
        .eq('date', date)
        .in('student_id', studentIds),
      'cargar ausencias del día',
    );

    if (error) throw error;
    return new Set((data || []).map((row: any) => row.student_id as string));
  }

  async deleteAbsence(absenceId: string): Promise<void> {
    const { error } = await withTimeout(
      supabase.from('absences').delete().eq('id', absenceId),
      'eliminar ausencia',
    );

    if (error) throw error;
  }
}

export default new StudentsService();
