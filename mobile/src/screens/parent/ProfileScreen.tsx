import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, StyleSheet, Alert } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { useAuthStore } from '@/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import studentsService from '@/servicios/students.service';
import { supabase } from '@/config/supabase';
import type { Student } from '@/types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [boardingAlerts, setBoardingAlerts] = useState(true);
  const [arrivalAlerts, setArrivalAlerts] = useState(true);
  const [deviationAlerts, setDeviationAlerts] = useState(true);
  const [myStudents, setMyStudents] = useState<Student[]>([]);
  const [driverName, setDriverName] = useState('—');
  const [linkCode, setLinkCode] = useState('');
  const [linking, setLinking] = useState(false);

  const loadStudents = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const list = await studentsService.getByParent(authUser.id);
      setMyStudents(list);

      if (list.length > 0 && list[0].driverId) {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('id', list[0].driverId)
          .single();
        if (data) setDriverName(data.name);
      }
    } catch {}
  };

  useEffect(() => { loadStudents(); }, []);

  const handleLinkCode = async () => {
    if (!linkCode.trim()) return;
    setLinking(true);
    try {
      await studentsService.redeemInvitationCode(linkCode.trim());
      setLinkCode('');
      Alert.alert('Vinculado', 'Tu cuenta quedó vinculada al estudiante correctamente.');
      await loadStudents();
    } catch (err: any) {
      Alert.alert('No se pudo vincular', err?.message || 'Código inválido o expirado.');
    } finally {
      setLinking(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user?.name?.charAt(0).toUpperCase() ?? 'P'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name ?? 'Padre/Madre'}</Text>
          <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
        </View>

        {/* Estudiantes */}
        <Text style={styles.sectionTitle}>
          {myStudents.length === 1 ? 'Mi hijo/a' : 'Mis hijos'}
        </Text>
        {myStudents.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Sin estudiantes vinculados aún.</Text>
          </Card>
        ) : (
          myStudents.map((student) => (
            <Card key={student.id} style={styles.studentCard}>
              <View style={styles.studentRow}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.studentInitial}>
                    {student.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentDetail}>{student.address}</Text>
                  <Text style={styles.studentDetail}>Conductor: {driverName}</Text>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Vincular código de invitación (registro inicial fallido o un hijo adicional) */}
        <Text style={styles.sectionTitle}>Vincular estudiante</Text>
        <Card>
          <Text style={styles.linkHelp}>
            Ingresa el código de invitación que te dio el conductor (válido por 48 horas).
          </Text>
          <Input
            label="Código de invitación"
            placeholder="VSL-XXXX-XXXX"
            value={linkCode}
            onChangeText={setLinkCode}
            autoCapitalize="characters"
          />
          <Button
            title="Vincular código"
            onPress={handleLinkCode}
            loading={linking}
            size="md"
            style={styles.linkButton}
          />
        </Card>

        {/* Notificaciones */}
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <Card>
          <SettingRow label="Notificaciones push" value={pushNotifications} onToggle={setPushNotifications} />
          <SettingRow label="Alerta de abordaje" value={boardingAlerts} onToggle={setBoardingAlerts} />
          <SettingRow label="Alerta de llegada" value={arrivalAlerts} onToggle={setArrivalAlerts} />
          <SettingRow label="Alerta de desvío" value={deviationAlerts} onToggle={setDeviationAlerts} last />
        </Card>

        {/* Cerrar sesión */}
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

function SettingRow({ label, value, onToggle, last = false }: { label: string; value: boolean; onToggle: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.settingRow, !last && styles.settingBorder]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: colors.primary, false: '#E0E0E0' }}
        thumbColor="#FFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarInitial: { fontSize: 32, fontWeight: '800', color: '#FFF' },
  userName: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text },
  userEmail: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  studentCard: { marginBottom: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  studentInitial: { fontSize: 18, fontWeight: '700', color: colors.primary },
  studentName: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  studentDetail: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginTop: 2 },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
  linkHelp: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginBottom: spacing.sm },
  linkButton: { marginTop: spacing.sm },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  settingBorder: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  settingLabel: { fontSize: typography.body.fontSize, color: colors.text },
  logoutButton: { marginTop: spacing.xxl },
});
