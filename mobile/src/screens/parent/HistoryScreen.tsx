import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { supabase } from '@/config/supabase';
import studentsService from '@/servicios/students.service';

interface HistoryScreenProps {
  navigation: any;
}

interface HistoryEntry {
  id: string;
  date: string;
  boardingTime: string;
  arrivalTime: string;
  status: 'completed' | 'absent';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

export const HistoryScreen: React.FC<HistoryScreenProps> = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const students = await studentsService.getByParent(user.id);
        if (students.length === 0) {
          setLoading(false);
          return;
        }

        const studentId = students[0].id;
        const since = new Date();
        since.setDate(since.getDate() - 90);
        const sinceDate = since.toISOString().split('T')[0];

        // HU19: el historial de 90 días debe incluir tanto los abordajes como las ausencias
        // registradas por el padre — antes solo se consultaban los abordajes.
        const [{ data: boardings, error: boardingsError }, { data: absences, error: absencesError }] =
          await Promise.all([
            supabase
              .from('boardings')
              .select('id, boarded_at, student_id, trip:trips(started_at, finished_at, status)')
              .eq('student_id', studentId)
              .order('boarded_at', { ascending: false })
              .limit(90),
            supabase
              .from('absences')
              .select('id, date, reason')
              .eq('student_id', studentId)
              .gte('date', sinceDate)
              .order('date', { ascending: false }),
          ]);

        if (boardingsError) throw boardingsError;
        if (absencesError) throw absencesError;

        const boardedEntries: HistoryEntry[] = (boardings || []).map((b: any) => ({
          id: `boarding-${b.id}`,
          date: b.boarded_at ? b.boarded_at.split('T')[0] : '',
          boardingTime: formatTime(b.boarded_at),
          arrivalTime: formatTime(b.trip?.finished_at),
          status: 'completed',
        }));

        const absentEntries: HistoryEntry[] = (absences || []).map((a: any) => ({
          id: `absence-${a.id}`,
          date: a.date,
          boardingTime: '—',
          arrivalTime: '—',
          status: 'absent',
        }));

        const merged = [...boardedEntries, ...absentEntries].sort((a, b) =>
          b.date.localeCompare(a.date),
        );

        setEntries(merged);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const completedCount = entries.filter((e) => e.status === 'completed').length;
  const absentCount = entries.filter((e) => e.status === 'absent').length;

  const renderEntry = ({ item }: { item: HistoryEntry }) => (
    <Card style={styles.entryCard}>
      <View style={styles.entryRow}>
        <View style={styles.entryLeft}>
          <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'completed' ? colors.success : colors.error }]} />
        </View>
        <View style={styles.entryCenter}>
          <Text style={styles.timeLabel}>Abordaje</Text>
          <Text style={styles.timeValue}>{item.boardingTime}</Text>
        </View>
        <View style={styles.entryCenter}>
          <Text style={styles.timeLabel}>Llegada</Text>
          <Text style={styles.timeValue}>{item.arrivalTime}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'completed' ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={[styles.statusText, { color: item.status === 'completed' ? colors.success : colors.error }]}>
            {item.status === 'completed' ? '✓' : '✗'}
          </Text>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumen */}
      <View style={styles.summary}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>Asistencias</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: colors.error }]}>{absentCount}</Text>
          <Text style={styles.summaryLabel}>Ausencias</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={[styles.summaryNumber, { color: colors.primary }]}>
            {entries.length > 0 ? Math.round((completedCount / entries.length) * 100) : 0}%
          </Text>
          <Text style={styles.summaryLabel}>Asistencia</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Últimos 90 días</Text>

      {entries.length === 0 ? (
        <EmptyState
          icon="history"
          title="Sin historial"
          message="No hay registros de viajes para mostrar aún."
        />
      ) : (
        <FlatList
          data={entries}
          renderItem={renderEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: 0 },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  summaryNumber: { fontSize: 24, fontWeight: '800', color: colors.success },
  summaryLabel: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  list: { padding: spacing.lg, paddingTop: 0 },
  entryCard: { marginBottom: spacing.sm, padding: spacing.md },
  entryRow: { flexDirection: 'row', alignItems: 'center' },
  entryLeft: { flex: 1.2, flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDate: { fontSize: typography.small.fontSize, fontWeight: '600', color: colors.text },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  entryCenter: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 10, color: colors.textSecondary },
  timeValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, marginTop: 2 },
  statusBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 16, fontWeight: '700' },
});
