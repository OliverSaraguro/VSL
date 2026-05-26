import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';

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

const MOCK_HISTORY: HistoryEntry[] = [
  { id: '1', date: '2026-05-25', boardingTime: '06:38', arrivalTime: '07:15', status: 'completed' },
  { id: '2', date: '2026-05-24', boardingTime: '06:40', arrivalTime: '07:18', status: 'completed' },
  { id: '3', date: '2026-05-23', boardingTime: '06:35', arrivalTime: '07:12', status: 'completed' },
  { id: '4', date: '2026-05-22', boardingTime: '-', arrivalTime: '-', status: 'absent' },
  { id: '5', date: '2026-05-21', boardingTime: '06:42', arrivalTime: '07:20', status: 'completed' },
  { id: '6', date: '2026-05-20', boardingTime: '06:37', arrivalTime: '07:14', status: 'completed' },
  { id: '7', date: '2026-05-19', boardingTime: '06:39', arrivalTime: '07:16', status: 'completed' },
  { id: '8', date: '2026-05-18', boardingTime: '06:41', arrivalTime: '07:19', status: 'completed' },
  { id: '9', date: '2026-05-17', boardingTime: '-', arrivalTime: '-', status: 'absent' },
  { id: '10', date: '2026-05-16', boardingTime: '06:36', arrivalTime: '07:13', status: 'completed' },
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [entries] = useState<HistoryEntry[]>(MOCK_HISTORY);

  const completedCount = entries.filter(e => e.status === 'completed').length;
  const absentCount = entries.filter(e => e.status === 'absent').length;

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
            {Math.round((completedCount / entries.length) * 100)}%
          </Text>
          <Text style={styles.summaryLabel}>Asistencia</Text>
        </Card>
      </View>

      <Text style={styles.sectionTitle}>Últimos 90 días</Text>

      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
