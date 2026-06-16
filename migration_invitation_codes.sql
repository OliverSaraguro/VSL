-- Ejecuta esto en el SQL Editor de Supabase del proyecto VSL-GRUPO4.
-- Agrega un código de invitación POR ESTUDIANTE (con expiración de 48h) para que el padre
-- se vincule de verdad al estudiante correcto al registrarse (HU02), en vez de depender de que
-- el correo ingresado por el conductor coincida exactamente con el de una cuenta ya existente.
--
-- El canje del código se hace con la función redeem_invitation_code(), que corre con privilegios
-- elevados (security definer) porque un padre recién registrado todavía no tiene permiso de RLS
-- para leer la fila del estudiante al que se quiere vincular.

alter table public.students
  add column if not exists invitation_code text,
  add column if not exists invitation_code_expires_at timestamptz;

create unique index if not exists students_invitation_code_idx
  on public.students (invitation_code)
  where invitation_code is not null;

create or replace function public.redeem_invitation_code(code text)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión para vincular un código de invitación.';
  end if;

  select * into v_student
  from public.students
  where invitation_code = upper(trim(code))
  for update;

  if v_student.id is null then
    raise exception 'El código de invitación no es válido.';
  end if;

  if v_student.parent_id is not null then
    raise exception 'Este código ya fue utilizado por otro representante.';
  end if;

  if v_student.invitation_code_expires_at is null or v_student.invitation_code_expires_at < now() then
    raise exception 'El código de invitación expiró (válido por 48 horas). Pide uno nuevo al conductor.';
  end if;

  update public.students
    set parent_id = auth.uid(),
        invitation_code = null,
        invitation_code_expires_at = null
    where id = v_student.id
    returning * into v_student;

  return v_student;
end;
$$;

grant execute on function public.redeem_invitation_code(text) to authenticated;
