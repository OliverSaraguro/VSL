import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { colors, typography, spacing } from '@/config/theme';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { RouteCard } from '@/components/routes/RouteCard';
import { StudentCard } from '@/components/students/StudentCard';
import { useRoutesStore } from '@/store/routes.store';
import { useAuthStore } from '@/store/auth.store';
import type { Student } from '@/types';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const route  = useRoute();
  const isRoutesTab = route.name === 'RoutesList';
  const { user } = useAuthStore();
  const { todayRoute, fetchTodayRoute } = useRoutesStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [absentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await fetchTodayRoute();
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [fetchTodayRoute]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (todayRoute?.stops) {
      const routeStudents = todayRoute.stops.map((stop: any) => stop.student).filter(Boolean);
      setStudents(routeStudents);
    }
  }, [todayRoute]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 4 : 0) + spacing.md }]}>
        <View>
          <Text style={styles.greeting}>
            {isRoutesTab ? 'Mis Rutas' : `Hola, ${user?.name?.split(' ')[0] ?? 'Conductor'}`}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('es-EC', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{students.length}</Text>
            <Text style={styles.statLabel}>Estudiantes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.error }]}>{absentCount}</Text>
            <Text style={styles.statLabel}>Ausencias</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statNumber, { color: colors.success }]}>
              {students.length - absentCount}
            </Text>
            <Text style={styles.statLabel}>Activos</Text>
          </Card>
        </View>

        {/* Ruta del día */}
        <Text style={styles.sectionTitle}>Ruta del día</Text>
        {todayRoute ? (
          <>
            <RouteCard
              route={todayRoute}
              onPress={() => navigation.navigate('RouteDetail', { routeId: todayRoute.id })}
            />
            <Button
              title="Iniciar Ruta"
              onPress={() => navigation.navigate('ActiveRoute', { routeId: todayRoute.id })}
              size="lg"
              style={styles.startButton}
            />
          </>
        ) : (
          <EmptyState
            icon="route"
            title="Sin ruta programada"
            message="No tienes una ruta configurada para hoy."
            actionLabel="Crear ruta"
            onAction={() => navigation.navigate('CreateRoute')}
          />
        )}

        {/* Estudiantes */}
        {students.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Estudiantes</Text>
            {students.slice(0, 5).map((s) => (
              <StudentCard key={s.id} student={s} />
            ))}
            {students.length > 5 && (
              <Button
                title={`Ver todos (${students.length})`}
                onPress={() => navigation.navigate('DriverStudents')}
                variant="outline"
                size="sm"
                style={styles.viewAllButton}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  greeting: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  date: {
    fontSize: typography.body.fontSize,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  startButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
  },
  viewAllButton: {
    marginTop: spacing.sm,
  },
});
