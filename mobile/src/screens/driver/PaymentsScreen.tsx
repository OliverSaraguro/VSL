import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  RefreshControl,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import apiService from '@/services/api.service';

interface PaymentsScreenProps {
  navigation: any;
}

interface Payment {
  id: string;
  studentName: string;
  month: string;
  amount: number;
  paid: boolean;
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const data = await apiService.get<any[]>('/payments');
      const mapped = data
        .filter((p: any) => p.month === selectedMonth + 1)
        .map((p: any) => ({
          id: p.id,
          studentName: p.student?.name ?? 'Estudiante',
          month: MONTHS[p.month - 1],
          amount: p.amount,
          paid: p.status === 'PAID',
        }));
      setPayments(mapped);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const togglePayment = (paymentId: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, paid: !p.paid } : p))
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

  if (loading) return <LoadingScreen />;

  const paidCount = payments.filter((p) => p.paid).length;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const collectedAmount = payments.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);

  return (
    <View style={styles.container}>
      <Header title="Pagos" onBack={() => navigation.goBack()} />

      {/* Selector de mes */}
      <FlatList
        horizontal
        data={MONTHS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.monthList}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.monthChip, index === selectedMonth && styles.monthChipActive]}
            onPress={() => setSelectedMonth(index)}
          >
            <Text style={[styles.monthText, index === selectedMonth && styles.monthTextActive]}>
              {item.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Resumen */}
      <View style={styles.summary}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Cobrado</Text>
          <Text style={styles.summaryValue}>${collectedAmount.toFixed(2)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendiente</Text>
          <Text style={[styles.summaryValue, { color: colors.error }]}>
            ${(totalAmount - collectedAmount).toFixed(2)}
          </Text>
        </Card>
      </View>

      {/* Lista de pagos */}
      {payments.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Sin registros"
          message={`No hay pagos registrados para ${MONTHS[selectedMonth]}`}
        />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.paymentList}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => (
            <Card style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentName}>{item.studentName}</Text>
                <Text style={styles.paymentAmount}>${item.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.paymentToggle}>
                <Text style={[styles.paymentStatus, item.paid ? styles.paid : styles.pending]}>
                  {item.paid ? 'Pagado' : 'Pendiente'}
                </Text>
                <Switch
                  value={item.paid}
                  onValueChange={() => togglePayment(item.id)}
                  trackColor={{ false: '#E0E0E0', true: '#A5D6A7' }}
                  thumbColor={item.paid ? colors.success : '#FAFAFA'}
                />
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  monthList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 8,
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  monthChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthText: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  monthTextActive: {
    color: '#FFFFFF',
  },
  summary: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: colors.success,
    marginTop: 4,
  },
  paymentList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  paymentAmount: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  paymentStatus: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
  paid: {
    color: colors.success,
  },
  pending: {
    color: colors.warning,
  },
});
