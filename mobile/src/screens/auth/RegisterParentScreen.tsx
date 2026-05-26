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

interface RegisterParentScreenProps {
  navigation: any;
}

interface ParentForm {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  invitationCode: string;
}

const INITIAL_FORM: ParentForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  invitationCode: '',
};

export const RegisterParentScreen: React.FC<RegisterParentScreenProps> = ({ navigation }) => {
  const [form, setForm] = useState<ParentForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ParentForm, string>>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof ParentForm) => (value: string) => {
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
    if (!form.invitationCode.trim()) e.invitationCode = 'Código de invitación obligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await authService.registerParent(form);
      Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada. Inicia sesión.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo completar el registro. Verifica el código de invitación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Registro Padre/Madre" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Ingresa tus datos y el código de invitación proporcionado por el conductor.
          </Text>

          <Input label="Nombre completo" placeholder="María López" value={form.name} onChangeText={update('name')} error={errors.name} />
          <Input label="Correo electrónico" placeholder="correo@ejemplo.com" value={form.email} onChangeText={update('email')} error={errors.email} keyboardType="email-address" />
          <Input label="Teléfono" placeholder="0991234567" value={form.phone} onChangeText={update('phone')} error={errors.phone} keyboardType="phone-pad" />
          <Input label="Contraseña" placeholder="••••••••" value={form.password} onChangeText={update('password')} error={errors.password} secureTextEntry />
          <Input label="Confirmar contraseña" placeholder="••••••••" value={form.confirmPassword} onChangeText={update('confirmPassword')} error={errors.confirmPassword} secureTextEntry />
          <Input label="Código de invitación" placeholder="VSL-XXXX-XXXX" value={form.invitationCode} onChangeText={update('invitationCode')} error={errors.invitationCode} autoCapitalize="characters" />

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
  subtitle: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
});
