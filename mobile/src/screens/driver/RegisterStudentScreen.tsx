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
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import studentsService from '@/services/students.service';

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

export const RegisterStudentScreen: React.FC<RegisterStudentScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState<StudentForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof StudentForm, string>>>({});
  const [loading, setLoading] = useState(false);

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
    return Object.keys(e).length === 0;
  };

  const handlePickPhoto = () => {
    // Placeholder: integrar expo-image-picker
    Alert.alert('Foto', 'Funcionalidad de selección de foto pendiente.');
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await studentsService.create(form);
      Alert.alert('Estudiante registrado', 'El estudiante ha sido registrado exitosamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo registrar al estudiante.');
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
