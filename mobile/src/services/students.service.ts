import { supabase } from '../config/supabase';
import { Student, Absence, PaginatedResponse } from '../types';

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
  };
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
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return (data || []).map(mapStudent);
  }

  async getById(id: string): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapStudent(data);
  }

  async create(payload: any): Promise<Student> {
    // 1. Obtener el ID del conductor actualmente autenticado
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error('Conductor no autenticado. Inicia sesión de nuevo.');

    // 2. Intentar buscar el ID del padre si se ingresó un correo
    let parentId: string | null = null;
    if (payload.parentEmail && payload.parentEmail.trim()) {
      try {
        const { data: parentUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', payload.parentEmail.trim().toLowerCase())
          .eq('role', 'PARENT')
          .maybeSingle();
        
        if (parentUser) {
          parentId = parentUser.id;
        }
      } catch {
        // Ignorar si no se encuentra o hay error en la búsqueda
      }
    }

    // 3. Insertar en Supabase
    const { data, error } = await supabase
      .from('students')
      .insert({
        name: payload.name,
        photo_url: payload.photoUrl || null,
        address: payload.address,
        latitude: payload.latitude ?? -3.99313, // Centro de Loja (coordenadas por defecto)
        longitude: payload.longitude ?? -79.20456,
        is_active: payload.isActive ?? true,
        driver_id: authUser.id, // Asignar el ID del conductor logueado
        parent_id: parentId, // Vincular al padre si existía
      })
      .select()
      .single();

    if (error) throw error;
    return mapStudent(data);
  }

  async update(id: string, payload: Partial<Student>): Promise<Student> {
    const { data, error } = await supabase
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
      .single();

    if (error) throw error;
    return mapStudent(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getByRoute(routeId: string): Promise<Student[]> {
    // En Supabase un estudiante está asociado a una ruta mediante las paradas de la ruta.
    // Consultamos los estudiantes que tienen paradas en dicha ruta.
    const { data, error } = await supabase
      .from('stops')
      .select('student:students(*)')
      .eq('route_id', routeId);

    if (error) throw error;
    
    const students = (data || [])
      .map((item: any) => item.student)
      .filter(Boolean);

    return students.map(mapStudent);
  }

  async getByParent(parentId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parentId);

    if (error) throw error;
    return (data || []).map(mapStudent);
  }

  async reportAbsence(payload: Record<string, unknown>): Promise<Absence> {
    const { data, error } = await supabase
      .from('absences')
      .insert({
        student_id: payload.studentId,
        registered_by: payload.registeredBy,
        date: payload.date,
        reason: payload.reason,
      })
      .select()
      .single();

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

    const { data, error, count } = await supabase
      .from('absences')
      .select('*, student:students(*)', { count: 'exact' })
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .range(from, to);

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

  async deleteAbsence(absenceId: string): Promise<void> {
    const { error } = await supabase
      .from('absences')
      .delete()
      .eq('id', absenceId);

    if (error) throw error;
  }
}

export default new StudentsService();
