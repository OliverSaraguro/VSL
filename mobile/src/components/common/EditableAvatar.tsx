import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/config/theme';
import photosService from '@/servicios/photos.service';
import authService from '@/servicios/auth.service';
import { useAuthStore } from '@/store/auth.store';

interface EditableAvatarProps {
  userId: string;
  photoUrl?: string | null;
  name?: string;
  size?: number;
}

// Foto de perfil propia (conductor o padre de familia). Sube a Supabase Storage, guarda la URL
// en public.users.photo_url y refleja el cambio de inmediato en toda la app vía auth.store.
export const EditableAvatar: React.FC<EditableAvatarProps> = ({ userId, photoUrl, name, size = 80 }) => {
  const [uploading, setUploading] = useState(false);
  const [localPhotoUrl, setLocalPhotoUrl] = useState(photoUrl);

  React.useEffect(() => setLocalPhotoUrl(photoUrl), [photoUrl]);

  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para elegir una imagen.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const asset = result.assets[0];
      const publicUrl = await photosService.uploadProfilePhoto(userId, asset.uri, asset.mimeType);
      await authService.updatePhoto(userId, publicUrl);
      setLocalPhotoUrl(publicUrl);
      useAuthStore.getState().setPhotoUrl(publicUrl);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo actualizar la foto de perfil.');
    } finally {
      setUploading(false);
    }
  };

  const dimension = { width: size, height: size, borderRadius: size / 2 };

  return (
    <TouchableOpacity
      style={[styles.circle, dimension]}
      onPress={handlePick}
      disabled={uploading}
      accessibilityLabel="Cambiar foto de perfil"
    >
      {uploading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : localPhotoUrl ? (
        <Image source={{ uri: localPhotoUrl }} style={[styles.image, dimension]} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
          {(name?.charAt(0) || '?').toUpperCase()}
        </Text>
      )}
      <View style={styles.editBadge}>
        <Text style={styles.editIcon}>📷</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    position: 'absolute',
  },
  initial: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  editIcon: {
    fontSize: 12,
  },
});
