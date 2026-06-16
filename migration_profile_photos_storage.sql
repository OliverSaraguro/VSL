-- Ejecuta esto en el SQL Editor de Supabase del proyecto VSL-GRUPO4.
-- Mismo patrón que migration_student_photos_storage.sql, pero para la foto de perfil del propio
-- usuario (conductor o padre de familia), que se guarda en public.users.photo_url.
-- Cada usuario solo puede subir/editar archivos dentro de su propia carpeta
-- (profile-photos/<user_id>/...); la lectura es pública para que el <Image> de la app la muestre
-- con una URL simple.

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "Lectura pública de fotos de perfil" on storage.objects;
create policy "Lectura pública de fotos de perfil"
  on storage.objects for select
  to public
  using (bucket_id = 'profile-photos');

drop policy if exists "Usuarios suben su propia foto de perfil" on storage.objects;
create policy "Usuarios suben su propia foto de perfil"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios actualizan su propia foto de perfil" on storage.objects;
create policy "Usuarios actualizan su propia foto de perfil"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Usuarios eliminan su propia foto de perfil" on storage.objects;
create policy "Usuarios eliminan su propia foto de perfil"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
