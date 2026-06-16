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
import { MaterialIcons } from '@expo/vector-icons';
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

  const update = (field: keyof StudentForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación. Activa el GPS e intenta de nuevo.');
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
      Alert.alert('Registrado', 'El estudiante ha sido registrado exitosamente.', [
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
            onPress={() => Alert.alert('Foto', 'Funcionalidad de selección de foto próximamente.')}
            accessibilityLabel="Seleccionar foto del estudiante"
          >
            {form.photoUrl ? (
              <Image source={{ uri: form.photoUrl }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialIcons name="photo-camera" size={28} color={colors.secondary} />
                <Text style={styles.photoText}>Agregar foto</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Sección estudiante */}
          <View style={styles.sectionHeader}>
            <MaterialIcons name="school" size={18} color={colors.secondary} />
            <Text style={styles.section}>Datos del estudiante</Text>
          </View>

          <Input
            label="Nombre completo"
            placeholder="Ana García"
            value={form.name}
            onChangeText={update('name')}
            error={errors.name}
            icon={<MaterialIcons name="person" size={18} color={colors.textSecondary} />}
          />
          <Input
            label="Dirección de recogida"
            placeholder="Calle Sucre 12-34 y Bolívar"
            value={form.address}
            onChangeText={update('address')}
            error={errors.address}
            icon={<MaterialIcons name="home" size={18} color={colors.textSecondary} />}
          />

          {/* Mapa */}
          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapLabel}>Ubicación exacta de la casa</Text>
            <TouchableOpacity style={styles.locationBtn} onPress={handleUseMyLocation}>
              <MaterialIcons name="my-location" size={14} color={colors.secondary} />
              <Text style={styles.locationBtnText}>Mi ubicación</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.mapHelp}>Toca el mapa para marcar el punto exacto:</Text>

          <View style={[styles.mapWrapper, !!locationError && styles.mapWrapperError]}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {houseLocation && (
                <Marker
                  coordinate={houseLocation}
                  title="Casa del estudiante"
                  pinColor={colors.secondary}
                />
              )}
            </MapView>
            {!houseLocation && (
              <View style={styles.mapOverlay} pointerEvents="none">
                <MaterialIcons name="touch-app" size={32} color="rgba(30,58,95,0.5)" />
                <Text style={styles.mapOverlayText}>Toca para marcar</Text>
              </View>
            )}
          </View>
          {!!locationError && (
            <View style={styles.errorRow}>
              <MaterialIcons name="error-outline" size={14} color={colors.error} />
              <Text style={styles.errorTextMap}>{locationError}</Text>
            </View>
          )}

          {/* Sección representante */}
          <View style={styles.sectionHeader}>
            <MaterialIcons name="family-restroom" size={18} color={colors.secondary} />
            <Text style={styles.section}>Datos del representante</Text>
          </View>

          <Input
            label="Nombre del representante"
            placeholder="Carlos García"
            value={form.parentName}
            onChangeText={update('parentName')}
            error={errors.parentName}
            icon={<MaterialIcons name="person-outline" size={18} color={colors.textSecondary} />}
          />
          <Input
            label="Teléfono"
            placeholder="0991234567"
            value={form.parentPhone}
            onChangeText={update('parentPhone')}
            error={errors.parentPhone}
            keyboardType="phone-pad"
            icon={<MaterialIcons name="phone" size={18} color={colors.textSecondary} />}
          />
          <Input
            label="Correo electrónico (opcional)"
            placeholder="padre@ejemplo.com"
            value={form.parentEmail}
            onChangeText={update('parentEmail')}
            error={errors.parentEmail}
            keyboardType="email-address"
            icon={<MaterialIcons name="email" size={18} color={colors.textSecondary} />}
          />

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
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  photoContainer: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginBottom: 4,
  },
  mapLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  locationBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  mapHelp: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  mapWrapperError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  map: { flex: 1 },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.45)',
  },
  mapOverlayText: {
    fontSize: 12,
    color: 'rgba(30,58,95,0.6)',
    fontWeight: '600',
    marginTop: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  errorTextMap: {
    fontSize: 12,
    color: colors.error,
  },
  submitButton: {
    marginTop: spacing.xl,
    borderRadius: 14,
  },
});
