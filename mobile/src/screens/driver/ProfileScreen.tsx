import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/api.service';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiService.get<any>('/auth/profile');
        setProfile(data);
      } catch {}
    };
    loadProfile();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Mi Perfil" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.name?.charAt(0).toUpperCase() ?? 'C'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'Conductor'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>

        {/* Información del vehículo */}
        <Text style={styles.sectionTitle}>Vehículo</Text>
        <Card>
          <InfoRow label="Placa" value={profile?.driver?.plateNumber ?? '—'} />
          <InfoRow label="Modelo" value={profile?.driver?.vehicleModel ?? '—'} />
          <InfoRow label="Color" value={profile?.driver?.vehicleColor ?? '—'} />
          <InfoRow label="Licencia" value={profile?.driver?.licenseNumber ?? '—'} last />
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
              onValueChange={setLowPowerMode}
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
