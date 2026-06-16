import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { useAuthStore } from '@/store/auth.store';
import notificationsService from '@/servicios/notifications.service';
import studentsService from '@/servicios/students.service';
import { supabase } from '@/config/supabase';

interface ParentDashboardProps {
  navigation: any;
}

export const DashboardScreen: React.FC<ParentDashboardProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [studentName, setStudentName] = useState('tu hijo/a');
  const [driverName, setDriverName] = useState('—');
  const [routeActive, setRouteActive] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const [notifResult, studentsList] = await Promise.all([
        notificationsService.getAll({ limit: 5 }),
        studentsService.getByParent(authUser.id),
      ]);

      setNotifications(notifResult.data);

      if (studentsList.length > 0) {
        const student = studentsList[0];
        setStudentName(student.name);

        if (student.driverId) {
          const [driverResult, tripResult] = await Promise.all([
            supabase.from('users').select('name').eq('id', student.driverId).single(),
            supabase
              .from('trips')
              .select('id, status')
              .eq('driver_id', student.driverId)
              .in('status', ['in_progress', 'paused'])
              .limit(1)
              .maybeSingle(),
          ]);
          if (driverResult.data) setDriverName(driverResult.data.name);
          setRouteActive(!!tripResult.data);
        }
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'Padre'}</Text>
        <Text style={styles.subtitle}>Transporte de {studentName}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Estado de la ruta */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.cardTitle}>Estado de la ruta</Text>
            <View style={[styles.badge, { backgroundColor: routeActive ? '#E8F5E9' : '#F5F5F5' }]}>
              <View style={[styles.badgeDot, { backgroundColor: routeActive ? colors.success : colors.statusFinished }]} />
              <Text style={[styles.badgeText, { color: routeActive ? colors.success : colors.textSecondary }]}>
                {routeActive ? 'ACTIVA' : 'FINALIZADA'}
              </Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Estado</Text>
              <Text style={styles.etaValue}>{routeActive ? 'En camino' : 'Sin actividad'}</Text>
            </View>
            <View style={styles.etaDivider} />
            <View style={styles.etaItem}>
              <Text style={styles.etaLabel}>Conductor</Text>
              <Text style={styles.etaValueHighlight}>{driverName}</Text>
            </View>
          </View>

          <Button
            title="📍  Ver en mapa"
            onPress={() => navigation.navigate('ParentTracking')}
            size="md"
            style={styles.trackButton}
          />
        </Card>

        {/* Notificaciones */}
        <Text style={styles.sectionTitle}>Notificaciones recientes</Text>
        {notifications.length > 0 ? (
          notifications.map((notif: any, idx: number) => (
            <Card key={notif.id || idx} style={styles.notifCard}>
              <Text style={styles.notifTitle}>{notif.title}</Text>
              <Text style={styles.notifMessage}>{notif.body}</Text>
            </Card>
          ))
        ) : (
          <Card style={styles.emptyNotif}>
            <Text style={styles.emptyNotifText}>Sin notificaciones recientes</Text>
          </Card>
        )}

        {/* Acciones rápidas */}
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsRow}>
          <Card style={styles.actionCard}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
            <Button title="Historial" onPress={() => navigation.navigate('ParentHistory')} variant="outline" size="sm" />
          </Card>
          <Card style={styles.actionCard}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>🚫</Text>
            <Button title="Ausencia" onPress={() => navigation.navigate('ParentAbsence')} variant="outline" size="sm" />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.surface },
  greeting: { fontSize: typography.h2.fontSize, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginTop: 2 },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  statusCard: { marginBottom: spacing.md },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  badgeText: { fontSize: typography.small.fontSize, fontWeight: '700' },
  etaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, padding: spacing.md },
  etaItem: { flex: 1, alignItems: 'center' },
  etaDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
  etaLabel: { fontSize: typography.small.fontSize, color: colors.textSecondary },
  etaValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, marginTop: 4 },
  etaValueHighlight: { fontSize: typography.body.fontSize, fontWeight: '800', color: colors.primary, marginTop: 4 },
  trackButton: { marginTop: spacing.md },
  sectionTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  notifCard: { marginBottom: spacing.sm, padding: spacing.md },
  notifTitle: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  notifMessage: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginTop: 2 },
  emptyNotif: { alignItems: 'center', padding: spacing.lg },
  emptyNotifText: { fontSize: typography.body.fontSize, color: colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionCard: { flex: 1, alignItems: 'center', padding: spacing.md },
});
