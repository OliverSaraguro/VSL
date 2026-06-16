import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { RouteCard } from '@/components/routes/RouteCard';
import { StudentCard } from '@/components/students/StudentCard';
import { useRoutesStore } from '@/store/routes.store';
import { useAuthStore } from '@/store/auth.store';
import studentsService from '@/servicios/students.service';
import type { Student } from '@/types';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const { todayRoute, fetchTodayRoute } = useRoutesStore();
  const [students, setStudents] = useState<Student[]>([]);
  const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
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

      // HU07: las ausencias registradas para hoy se muestran tachadas en el panel inicial.
      const today = new Date().toISOString().split('T')[0];
      studentsService
        .getAbsentStudentIds(routeStudents.map((s: Student) => s.id), today)
        .then(setAbsentIds)
        .catch(() => setAbsentIds(new Set()));
    }
  }, [todayRoute]);

  const absentCount = absentIds.size;

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] ?? 'Conductor'}</Text>
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
              title="🚌  Iniciar Ruta"
              onPress={() => navigation.navigate('ActiveRoute', { routeId: todayRoute.id })}
              size="lg"
              style={styles.startButton}
            />
          </>
        ) : (
          <EmptyState
            icon="🛣️"
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
              <StudentCard key={s.id} student={s} absent={absentIds.has(s.id)} />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  greeting: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: colors.text,
  },
  date: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
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
