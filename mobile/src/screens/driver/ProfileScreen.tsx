import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { EditableAvatar } from '@/components/common/EditableAvatar';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/config/supabase';
import { LOW_POWER_MODE_KEY } from '@/config/lowPowerMode';

interface ProfileScreenProps {
  navigation: any;
}

interface DriverMeta {
  plateNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  licenseNumber: string;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [driverMeta, setDriverMeta] = useState<DriverMeta>({
    plateNumber: '—',
    vehicleModel: '—',
    vehicleColor: '—',
    licenseNumber: '—',
  });

  React.useEffect(() => {
    // Los datos del vehículo se guardan en public.drivers al registrarse (ver
    // auth.service.ts -> registerDriver), no en los metadatos de Supabase Auth: por eso antes
    // siempre se veían en "—" aquí.
    const loadMeta = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('drivers')
          .select('plate_number, vehicle_model, vehicle_color, license_number')
          .eq('id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (data) {
          setDriverMeta({
            plateNumber: data.plate_number || '—',
            vehicleModel: data.vehicle_model || '—',
            vehicleColor: data.vehicle_color || '—',
            licenseNumber: data.license_number || '—',
          });
        }
      } catch {}
    };
    loadMeta();
  }, [user?.id]);

  useEffect(() => {
    AsyncStorage.getItem(LOW_POWER_MODE_KEY).then((value) => setLowPowerMode(value === 'true'));
  }, []);

  const handleToggleLowPower = async (value: boolean) => {
    setLowPowerMode(value);
    await AsyncStorage.setItem(LOW_POWER_MODE_KEY, value ? 'true' : 'false');
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 4 : 0) + spacing.sm }]}>
        <Text style={styles.pageTitle}>Perfil</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          {user && <EditableAvatar userId={user.id} photoUrl={user.photoUrl} name={user.name} size={80} />}
          <Text style={styles.userName}>{user?.name ?? 'Conductor'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>

        {/* Información del vehículo */}
        <Text style={styles.sectionTitle}>Vehículo</Text>
        <Card>
          <InfoRow label="Placa" value={driverMeta.plateNumber} />
          <InfoRow label="Modelo" value={driverMeta.vehicleModel} />
          <InfoRow label="Color" value={driverMeta.vehicleColor} />
          <InfoRow label="Licencia" value={driverMeta.licenseNumber} last />
        </Card>

        {/* Configuración */}
        <Text style={styles.sectionTitle}>Configuración</Text>
        <Card>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Modo bajo consumo</Text>
              <Text style={styles.settingDescription}>
                Reduce la frecuencia de actualización de ubicación
              </Text>
            </View>
            <Switch
              value={lowPowerMode}
              onValueChange={handleToggleLowPower}
              trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
              thumbColor={lowPowerMode ? colors.success : '#FAFAFA'}
            />
          </View>
        </Card>

        <Button
          title="Cerrar sesión"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value: string; last?: boolean }> = ({
  label,
  value,
  last = false,
}) => (
  <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pageSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 220,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
});
