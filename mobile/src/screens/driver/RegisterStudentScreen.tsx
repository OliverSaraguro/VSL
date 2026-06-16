import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import studentsService from '@/servicios/students.service';
import { useLocation } from '@/hooks/useLocation';
import { Coordinates } from '@/types';

interface RegisterStudentScreenProps {
  navigation: any;
}

interface StudentForm {
  name: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  photoUrl: string;
}

const INITIAL_FORM: StudentForm = {
  name: '',
  address: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  photoUrl: '',
};

const DEFAULT_REGION = {
  latitude: -3.99313,
  longitude: -79.20456,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

export const RegisterStudentScreen: React.FC<RegisterStudentScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState<StudentForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentForm, string>>>({});
  const [loading, setLoading] = useState(false);
  const [houseLocation, setHouseLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState('');
  const { getCurrentLocation } = useLocation();

  const update = (field: keyof StudentForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Nombre obligatorio';
    if (!form.address.trim()) e.address = 'Dirección obligatoria';
    if (!form.parentName.trim()) e.parentName = 'Nombre del representante obligatorio';
    if (!form.parentPhone.trim()) e.parentPhone = 'Teléfono obligatorio';
    setErrors(e);

    if (!houseLocation) {
      setLocationError('Toca el mapa para marcar la casa del estudiante');
      return false;
    }
    setLocationError('');
    return Object.keys(e).length === 0;
  };

  const handlePickPhoto = () => {
    // Placeholder: integrar expo-image-picker
    Alert.alert('Foto', 'Funcionalidad de selección de foto pendiente.');
  };

  const handleMapPress = (e: any) => {
    setHouseLocation(e.nativeEvent.coordinate);
    setLocationError('');
  };

  const handleUseMyLocation = async () => {
    const coords = await getCurrentLocation();
    if (coords) {
      setHouseLocation(coords);
      setLocationError('');
    } else {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación actual. Activa el GPS e intenta de nuevo.');
    }
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await studentsService.create({
        ...form,
        latitude: houseLocation!.latitude,
        longitude: houseLocation!.longitude,
      });
      Alert.alert('Estudiante registrado', 'El estudiante ha sido registrado exitosamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo registrar al estudiante.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Registrar Estudiante" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Foto */}
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handlePickPhoto}
            accessibilityLabel="Seleccionar foto del estudiante"
          >
            {form.photoUrl ? (
              <Image source={{ uri: form.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoText}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.section}>Datos del estudiante</Text>
          <Input label="Nombre completo" placeholder="Ana García" value={form.name} onChangeText={update('name')} error={errors.name} />
          <Input label="Dirección de recogida" placeholder="Calle Sucre 12-34 y Bolívar" value={form.address} onChangeText={update('address')} error={errors.address} />

          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapLabel}>Ubicación exacta de la casa</Text>
            <TouchableOpacity onPress={handleUseMyLocation}>
              <Text style={styles.useLocationLink}>📍 Usar mi ubicación actual</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.mapHelp}>Toca el mapa en el punto exacto de la casa del estudiante:</Text>
          <View style={[styles.mapWrapper, !!locationError && styles.mapWrapperError]}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {houseLocation && (
                <Marker coordinate={houseLocation} title="Casa del estudiante" pinColor={colors.primary} />
              )}
            </MapView>
          </View>
          {!!locationError && <Text style={styles.errorTextMap}>{locationError}</Text>}

          <Text style={styles.section}>Datos del representante</Text>
          <Input label="Nombre del representante" placeholder="Carlos García" value={form.parentName} onChangeText={update('parentName')} error={errors.parentName} />
          <Input label="Teléfono" placeholder="0991234567" value={form.parentPhone} onChangeText={update('parentPhone')} error={errors.parentPhone} keyboardType="phone-pad" />
          <Input label="Correo electrónico (opcional)" placeholder="padre@ejemplo.com" value={form.parentEmail} onChangeText={update('parentEmail')} error={errors.parentEmail} keyboardType="email-address" />

          <Button
            title="Registrar Estudiante"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            style={styles.submitButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  photoIcon: {
    fontSize: 28,
  },
  photoText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  mapLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  useLocationLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  mapHelp: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  mapWrapperError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  map: {
    flex: 1,
  },
  errorTextMap: {
    fontSize: 12,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  section: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
