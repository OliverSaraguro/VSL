-- Ejecuta esto en el SQL Editor de Supabase del proyecto VSL-GRUPO4.
-- Crea el bucket de Storage para las fotos de los estudiantes y las políticas de acceso.
-- Cada conductor solo puede subir/editar archivos dentro de su propia carpeta
-- (student-photos/<driver_id>/...), pero las fotos son de lectura pública (para que el
-- <Image> de la app las pueda mostrar con una URL simple, sin firmar tokens).

insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

drop policy if exists "Lectura pública de fotos de estudiantes" on storage.objects;
create policy "Lectura pública de fotos de estudiantes"
  on storage.objects for select
  to public
  using (bucket_id = 'student-photos');

drop policy if exists "Conductores suben fotos de sus estudiantes" on storage.objects;
create policy "Conductores suben fotos de sus estudiantes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Conductores actualizan fotos de sus estudiantes" on storage.objects;
create policy "Conductores actualizan fotos de sus estudiantes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Conductores eliminan fotos de sus estudiantes" on storage.objects;
create policy "Conductores eliminan fotos de sus estudiantes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'student-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
