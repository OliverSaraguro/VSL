import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Header } from '@/components/common/Header';
import { authService } from '@/services/auth.service';

interface RegisterDriverScreenProps {
  navigation: any;
}

interface DriverForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  licensePlate: string;
  licenseNumber: string;
  vehicleModel: string;
  vehicleColor: string;
}

const INITIAL_FORM: DriverForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  licensePlate: '',
  licenseNumber: '',
  vehicleModel: '',
  vehicleColor: '',
};

export const RegisterDriverScreen: React.FC<RegisterDriverScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState<DriverForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof DriverForm, string>>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof DriverForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Nombre obligatorio';
    if (!form.email.trim()) e.email = 'Correo obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Correo no válido';
    if (!form.phone.trim()) e.phone = 'Teléfono obligatorio';
    if (!form.password) e.password = 'Contraseña obligatoria';
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    if (!form.licensePlate.trim()) e.licensePlate = 'Placa obligatoria';
    if (!form.licenseNumber.trim()) e.licenseNumber = 'Licencia obligatoria';
    if (!form.vehicleModel.trim()) e.vehicleModel = 'Modelo obligatorio';
    if (!form.vehicleColor.trim()) e.vehicleColor = 'Color obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.registerDriver(form);
      Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada. Inicia sesión.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo completar el registro. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Registro Conductor" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.section}>Datos personales</Text>
          <Input label="Nombre completo" placeholder="Juan Pérez" value={form.name} onChangeText={update('name')} error={errors.name} />
          <Input label="Correo electrónico" placeholder="correo@ejemplo.com" value={form.email} onChangeText={update('email')} error={errors.email} keyboardType="email-address" />
          <Input label="Teléfono" placeholder="0991234567" value={form.phone} onChangeText={update('phone')} error={errors.phone} keyboardType="phone-pad" />
          <Input label="Contraseña" placeholder="••••••••" value={form.password} onChangeText={update('password')} error={errors.password} secureTextEntry />
          <Input label="Confirmar contraseña" placeholder="••••••••" value={form.confirmPassword} onChangeText={update('confirmPassword')} error={errors.confirmPassword} secureTextEntry />

          <Text style={styles.section}>Datos del vehículo</Text>
          <Input label="Número de placa" placeholder="ABC-1234" value={form.licensePlate} onChangeText={update('licensePlate')} error={errors.licensePlate} autoCapitalize="characters" />
          <Input label="Número de licencia" placeholder="1234567890" value={form.licenseNumber} onChangeText={update('licenseNumber')} error={errors.licenseNumber} />
          <Input label="Modelo del vehículo" placeholder="Toyota HiAce 2020" value={form.vehicleModel} onChangeText={update('vehicleModel')} error={errors.vehicleModel} />
          <Input label="Color del vehículo" placeholder="Amarillo" value={form.vehicleColor} onChangeText={update('vehicleColor')} error={errors.vehicleColor} />

          <Button
            title="Crear cuenta"
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
  section: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
