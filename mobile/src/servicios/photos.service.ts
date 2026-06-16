import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../config/supabase';

const STUDENT_BUCKET = 'student-photos';
const PROFILE_BUCKET = 'profile-photos';

function extensionFromMimeOrUri(localUri: string, mimeType?: string): string {
  if (mimeType?.includes('/')) return mimeType.split('/')[1].toLowerCase();
  const match = /\.(\w+)$/.exec(localUri);
  return (match?.[1] || 'jpg').toLowerCase();
}

class PhotosService {
  // Sube una imagen local a un bucket público de Supabase Storage, dentro de la carpeta del
  // propio usuario (ownerId), y devuelve la URL pública. Las políticas de Storage solo dejan
  // escribir dentro de la propia carpeta (ver migration_*_photos_storage.sql).
  //
  // OJO: se lee el archivo con expo-file-system (base64 -> ArrayBuffer) en vez de
  // fetch(uri).blob(). El polyfill de fetch/Blob de React Native es poco confiable para leer
  // archivos locales (file://, content://) y suele fallar con "Network request failed" al
  // subir fotos elegidas con expo-image-picker; leer el archivo directamente del disco evita
  // ese problema por completo.
  private async upload(bucket: string, ownerId: string, localUri: string, mimeType?: string): Promise<string> {
    const ext = extensionFromMimeOrUri(localUri, mimeType);
    const path = `${ownerId}/${Date.now()}.${ext}`;

    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
      contentType: mimeType || `image/${ext}`,
      upsert: true,
    });

    if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  // Foto del estudiante (la sube el conductor) -> students.photo_url
  async uploadStudentPhoto(driverId: string, localUri: string, mimeType?: string): Promise<string> {
    return this.upload(STUDENT_BUCKET, driverId, localUri, mimeType);
  }

  // Foto de perfil propia (conductor o padre de familia) -> users.photo_url
  async uploadProfilePhoto(userId: string, localUri: string, mimeType?: string): Promise<string> {
    return this.upload(PROFILE_BUCKET, userId, localUri, mimeType);
  }
}

export default new PhotosService();
