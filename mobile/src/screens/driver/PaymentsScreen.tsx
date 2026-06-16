import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
<<<<<<< Updated upstream
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '@/config/theme';
import paymentsService, { PaymentRecord } from '@/servicios/payments.service';
import studentsService from '@/servicios/students.service';
import type { Student } from '@/types';

// ─── Constants ──────────────────────────────────────────────────────────────
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTHS_FULL = [
=======
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import paymentsService from '@/servicios/payments.service';
import studentsService from '@/servicios/students.service';
import { useAuthStore } from '@/store/auth.store';
import type { Student } from '@/types';

interface PaymentsScreenProps {
  navigation: any;
}

interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  month: number;
  amount: number;
  paid: boolean;
}

const MONTHS = [
>>>>>>> Stashed changes
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

<<<<<<< Updated upstream
// ─── Helpers ─────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0'); }

function toISODate(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getCalendarCells(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const offset   = firstDow === 0 ? 6 : firstDow - 1;
  const days     = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function SummaryCard({
  icon, value, label, bg, fg,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  value: string;
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <View style={[sumS.card, { backgroundColor: bg }]}>
      <MaterialIcons name={icon} size={20} color={fg} />
      <Text style={[sumS.value, { color: fg }]}>{value}</Text>
      <Text style={sumS.label}>{label}</Text>
    </View>
  );
}
const sumS = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 4, gap: 4 },
  value: { fontSize: 15, fontWeight: '800' },
  label: { fontSize: 10, color: colors.textSecondary, fontWeight: '500' },
});

function DayCell({
  day, hasPaid, hasPending, selected, isToday, onPress,
}: {
  day: number | null;
  hasPaid: boolean;
  hasPending: boolean;
  selected: boolean;
  isToday: boolean;
  onPress: () => void;
}) {
  if (!day) return <View style={dayS.cell} />;
  return (
    <TouchableOpacity style={dayS.cell} onPress={onPress} activeOpacity={0.7}>
      <View style={[dayS.circle, selected && dayS.circleSelected, isToday && !selected && dayS.circleToday]}>
        <Text style={[dayS.num, selected && dayS.numSelected, isToday && !selected && dayS.numToday]}>
          {day}
        </Text>
      </View>
      <View style={dayS.dots}>
        {hasPaid    && <View style={[dayS.dot, { backgroundColor: '#16A34A' }]} />}
        {hasPending && <View style={[dayS.dot, { backgroundColor: '#F59E0B' }]} />}
      </View>
    </TouchableOpacity>
  );
}
const dayS = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', paddingVertical: 4, minWidth: 36 },
  circle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  circleSelected: { backgroundColor: colors.primary },
  circleToday: { borderWidth: 2, borderColor: colors.secondary },
  num: { fontSize: 13, fontWeight: '500', color: colors.text },
  numSelected: { color: '#FFF', fontWeight: '700' },
  numToday: { color: colors.secondary, fontWeight: '700' },
  dots: { flexDirection: 'row', gap: 2, height: 5, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});

function PaymentItem({
  item, onToggle, onEdit,
}: {
  item: PaymentRecord;
  onToggle: (id: string) => void;
  onEdit: (item: PaymentRecord) => void;
}) {
  const paid = item.status === 'PAID';
  return (
    <TouchableOpacity style={piS.row} onPress={() => onEdit(item)} activeOpacity={0.75}>
      <View style={piS.avatar}>
        <Text style={piS.avatarText}>{item.studentName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={piS.info}>
        <Text style={piS.name} numberOfLines={1}>{item.studentName}</Text>
        <Text style={piS.date}>
          {item.dueDate
            ? new Date(item.dueDate + 'T00:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
            : '—'}
          {item.notes ? `  ·  ${item.notes}` : ''}
        </Text>
      </View>
      <Text style={piS.amount}>${item.amount.toFixed(2)}</Text>
      <TouchableOpacity
        style={[piS.badge, paid ? piS.badgePaid : piS.badgePending]}
        onPress={() => onToggle(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons
          name={paid ? 'check-circle' : 'radio-button-unchecked'}
          size={15}
          color={paid ? '#16A34A' : colors.textSecondary}
        />
        <Text style={[piS.badgeText, paid ? piS.badgeTextPaid : piS.badgeTextPending]}>
          {paid ? 'Pagado' : 'Pendiente'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
const piS = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: colors.secondary },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text },
  date: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: '800', color: colors.text, marginRight: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20 },
  badgePaid: { backgroundColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#F1F5F9' },
  badgeText: { fontSize: 10, fontWeight: '700' },
  badgeTextPaid: { color: '#16A34A' },
  badgeTextPending: { color: colors.textSecondary },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
type Filter = 'ALL' | 'PAID' | 'PENDING';

export const PaymentsScreen: React.FC<{ navigation: any }> = () => {
  const insets = useSafeAreaInsets();
  const today  = new Date();

  // Calendar display
  const [display, setDisplay] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year  = display.getFullYear();
  const month = display.getMonth(); // 0-indexed

  // Data
  const [payments,  setPayments]  = useState<PaymentRecord[]>([]);
  const [students,  setStudents]  = useState<Student[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [filter,      setFilter]      = useState<Filter>('ALL');

  // Modal state
  const [modalVisible,    setModalVisible]    = useState(false);
  const [editingPayment,  setEditingPayment]  = useState<PaymentRecord | null>(null);
  const [modalStep,       setModalStep]       = useState<'student' | 'form'>('student');
  const [modalStudent,    setModalStudent]    = useState<Student | null>(null);
  const [modalAmount,     setModalAmount]     = useState('');
  const [modalDate,       setModalDate]       = useState('');
  const [modalNotes,      setModalNotes]      = useState('');
  const [saving,          setSaving]          = useState(false);
  const [studentSearch,   setStudentSearch]   = useState('');

  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    try {
      const data = await paymentsService.getByMonthYear(month + 1, year);
      setPayments(data);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron cargar los pagos.');
=======
export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Formulario "Registrar Pago"
  const [showForm, setShowForm] = useState(false);
  const [formStudentId, setFormStudentId] = useState<string | null>(null);
  const [formAmount, setFormAmount] = useState('');
  const [formPaid, setFormPaid] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const [data, studentList] = await Promise.all([
        paymentsService.getAll(),
        studentsService.getAll(),
      ]);
      const mapped: Payment[] = data.map((p) => ({
        id: p.id,
        studentId: p.studentId,
        studentName: p.studentName,
        month: p.month,
        amount: p.amount,
        paid: p.status === 'PAID',
      }));
      setAllPayments(mapped);
      setPayments(mapped.filter((p) => p.month === selectedMonth + 1));
      setStudents(studentList);
    } catch (err: any) {
      console.error('[PaymentsScreen] loadPayments', err);
      setAllPayments([]);
      setPayments([]);
      Alert.alert('Error', err?.message || 'No se pudieron cargar los pagos.');
>>>>>>> Stashed changes
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    setLoading(true);
    loadPayments();
  }, [loadPayments]);

  const loadStudents = useCallback(async () => {
    try {
      const data = await studentsService.getAll();
      setStudents(data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPayments();
    setRefreshing(false);
  };

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // ── Calendar ───────────────────────────────────────────────────────────────
  const cells = useMemo(() => getCalendarCells(year, month), [year, month]);
=======
=======
>>>>>>> Stashed changes
  const openForm = () => {
    setFormStudentId(students[0]?.id ?? null);
    setFormAmount('');
    setFormPaid(true);
    setShowForm(true);
  };

  const handleSavePayment = async () => {
    if (!user) return;
    if (!formStudentId) {
      Alert.alert('Falta el estudiante', 'Selecciona a qué estudiante corresponde el pago.');
      return;
    }
    const amount = parseFloat(formAmount.replace(',', '.'));
    if (!amount || amount <= 0) {
      Alert.alert('Monto inválido', 'Ingresa el valor de la mensualidad.');
      return;
    }

    setSaving(true);
    try {
      await paymentsService.upsert({
        studentId: formStudentId,
        driverId: user.id,
        month: selectedMonth + 1,
        year: new Date().getFullYear(),
        amount,
        status: formPaid ? 'PAID' : 'PENDING',
      });
      setShowForm(false);
      await loadPayments();
      Alert.alert('Listo', `Pago de ${MONTHS[selectedMonth]} registrado correctamente.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo registrar el pago.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;
>>>>>>> Stashed changes

  function prevMonth() {
    setDisplay(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setDisplay(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    setSelectedDay(null);
  }

  function paymentsByDay(day: number) {
    return payments.filter(p => {
      if (!p.dueDate) return false;
      const d = new Date(p.dueDate + 'T00:00:00');
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  }

  // ── Derived / filtered list ────────────────────────────────────────────────
  const displayedPayments = useMemo(() => {
    let base = selectedDay !== null
      ? payments.filter(p => {
          if (!p.dueDate) return false;
          const d = new Date(p.dueDate + 'T00:00:00');
          return d.getDate() === selectedDay && d.getMonth() === month && d.getFullYear() === year;
        })
      : payments;
    if (filter === 'PAID')    return base.filter(p => p.status === 'PAID');
    if (filter === 'PENDING') return base.filter(p => p.status === 'PENDING');
    return base;
  }, [payments, selectedDay, month, year, filter]);

  const paidTotal    = useMemo(() => payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0), [payments]);
  const pendingTotal = useMemo(() => payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0), [payments]);

  // ── Toggle status ──────────────────────────────────────────────────────────
  const toggleStatus = async (id: string) => {
    const p = payments.find(x => x.id === id);
    if (!p) return;
    const next = p.status === 'PAID' ? 'PENDING' : 'PAID';
    setPayments(prev => prev.map(x => x.id === id ? { ...x, status: next } : x));
    try {
      await paymentsService.updateStatus(id, next === 'PAID');
    } catch {
      setPayments(prev => prev.map(x => x.id === id ? { ...x, status: p.status } : x));
      Alert.alert('Error', 'No se pudo actualizar el estado.');
    }
  };

  // ── Modal helpers ──────────────────────────────────────────────────────────
  const showModal = () => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1, useNativeDriver: true, tension: 80, friction: 10,
    }).start();
  };
  const hideModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0, duration: 200, useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const openAdd = () => {
    const d = selectedDay
      ? new Date(year, month, selectedDay)
      : new Date(year, month, today.getDate());
    setEditingPayment(null);
    setModalStep('student');
    setModalStudent(null);
    setModalAmount('');
    setModalDate(toISODate(d.getFullYear(), d.getMonth(), d.getDate()));
    setModalNotes('');
    setStudentSearch('');
    showModal();
  };

  const openEdit = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setModalStep('form');
    setModalStudent(students.find(s => s.id === payment.studentId) ?? {
      id: payment.studentId, name: payment.studentName,
    } as Student);
    setModalAmount(payment.amount.toFixed(2));
    setModalDate(payment.dueDate ?? toISODate(year, month, 1));
    setModalNotes(payment.notes ?? '');
    showModal();
  };

  const selectStudent = (s: Student) => {
    setModalStudent(s);
    setModalStep('form');
  };

  const savePayment = async () => {
    const amt = parseFloat(modalAmount.replace(',', '.'));
    if (!modalStudent) { Alert.alert('Atención', 'Selecciona un estudiante.'); return; }
    if (isNaN(amt) || amt <= 0) { Alert.alert('Atención', 'Ingresa un monto válido.'); return; }
    if (!modalDate) { Alert.alert('Atención', 'Selecciona una fecha.'); return; }
    setSaving(true);
    try {
      if (editingPayment) {
        await paymentsService.update(editingPayment.id, {
          amount: amt, dueDate: modalDate, notes: modalNotes || undefined,
        });
        await loadPayments();
      } else {
        const created = await paymentsService.create({
          studentId: modalStudent.id, amount: amt, dueDate: modalDate, notes: modalNotes || undefined,
        });
        setPayments(prev => [...prev, created]);
      }
      hideModal();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo guardar el pago.');
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = async () => {
    if (!editingPayment) return;
    Alert.alert('Eliminar pago', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          try {
            await paymentsService.remove(editingPayment.id);
            setPayments(prev => prev.filter(p => p.id !== editingPayment.id));
            hideModal();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudo eliminar.');
          }
        },
      },
    ]);
  };

  const adjustDate = (delta: number) => {
    if (!modalDate) return;
    const d = new Date(modalDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setModalDate(toISODate(d.getFullYear(), d.getMonth(), d.getDate()));
  };

  const filteredStudents = useMemo(
    () => studentSearch.trim()
      ? students.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
      : students,
    [students, studentSearch],
  );

  // ── Modal slide transform ──────────────────────────────────────────────────
  const slideTranslate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 4 : 0) + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Pagos</Text>
          {/* Pill llamativo para cambiar el mes */}
          <View style={styles.monthPill}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="chevron-left" size={22} color={colors.primary} />
            </TouchableOpacity>
            <MaterialIcons name="calendar-today" size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.monthPillText}>{MONTHS_FULL[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="chevron-right" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

<<<<<<< Updated upstream
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
      >
        {/* ── Summary cards ── */}
        <View style={styles.summaryRow}>
          <SummaryCard icon="check-circle" value={`$${paidTotal.toFixed(2)}`}    label="Cobrado"   bg="#DCFCE7" fg="#16A34A" />
          <SummaryCard icon="schedule"     value={`$${pendingTotal.toFixed(2)}`} label="Pendiente" bg="#FEF3C7" fg="#B45309" />
          <SummaryCard icon="people"       value={`${payments.filter(p => p.status === 'PAID').length}/${payments.length}`} label="Pagaron" bg="#EFF6FF" fg={colors.secondary} />
        </View>

        {/* ── Calendar card ── */}
        <View style={styles.calCard}>
          {/* Weekday headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={styles.weekLabel}>{d}</Text>
            ))}
          </View>

          {/* Day cells — render rows of 7 */}
          {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
            <View key={rowIdx} style={styles.weekRow}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                if (day === null) return <View key={colIdx} style={dayS.cell} />;
                const dayPayments = paymentsByDay(day);
                const hasPaid    = dayPayments.some(p => p.status === 'PAID');
                const hasPending = dayPayments.some(p => p.status === 'PENDING');
                return (
                  <DayCell
                    key={colIdx}
                    day={day}
                    hasPaid={hasPaid}
                    hasPending={hasPending}
                    selected={selectedDay === day}
                    isToday={isToday(day)}
                    onPress={() => setSelectedDay(prev => prev === day ? null : day)}
                  />
                );
              })}
            </View>
          ))}

          {/* Day deselect hint */}
          {selectedDay !== null && (
            <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.clearDayBtn}>
              <MaterialIcons name="close" size={13} color={colors.textSecondary} />
              <Text style={styles.clearDayText}>Ver todo el mes</Text>
            </TouchableOpacity>
=======
      <Button
        title={showForm ? 'Cancelar' : '➕  Registrar Pago'}
        onPress={() => (showForm ? setShowForm(false) : openForm())}
        variant={showForm ? 'outline' : 'primary'}
        size="md"
        style={styles.registerButton}
      />

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formLabel}>Estudiante</Text>
          {students.length === 0 ? (
            <Text style={styles.formEmpty}>No tienes estudiantes registrados todavía.</Text>
          ) : (
            <FlatList
              horizontal
              data={students}
              keyExtractor={(s) => s.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.studentChips}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.studentChip, formStudentId === item.id && styles.studentChipActive]}
                  onPress={() => setFormStudentId(item.id)}
                >
                  <Text style={[styles.studentChipText, formStudentId === item.id && styles.studentChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <Text style={styles.formMonthHint}>Mes: {MONTHS[selectedMonth]} {new Date().getFullYear()}</Text>

          <Input
            label="Monto ($)"
            placeholder="20.00"
            value={formAmount}
            onChangeText={setFormAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.formLabel}>Estado</Text>
          <View style={styles.statusToggle}>
            <TouchableOpacity
              style={[styles.statusOption, formPaid && styles.statusOptionPaidActive]}
              onPress={() => setFormPaid(true)}
            >
              <Text style={[styles.statusOptionText, formPaid && styles.statusOptionTextActive]}>✓ Cancelado</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusOption, !formPaid && styles.statusOptionPendingActive]}
              onPress={() => setFormPaid(false)}
            >
              <Text style={[styles.statusOptionText, !formPaid && styles.statusOptionTextActive]}>Pendiente</Text>
            </TouchableOpacity>
          </View>

          <Button title="Guardar pago" onPress={handleSavePayment} loading={saving} size="lg" style={styles.saveButton} />
        </Card>
      )}

      <Button
        title={showForm ? 'Cancelar' : '➕  Registrar Pago'}
        onPress={() => (showForm ? setShowForm(false) : openForm())}
        variant={showForm ? 'outline' : 'primary'}
        size="md"
        style={styles.registerButton}
      />

      {showForm && (
        <Card style={styles.formCard}>
          <Text style={styles.formLabel}>Estudiante</Text>
          {students.length === 0 ? (
            <Text style={styles.formEmpty}>No tienes estudiantes registrados todavía.</Text>
          ) : (
            <FlatList
              horizontal
              data={students}
              keyExtractor={(s) => s.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.studentChips}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.studentChip, formStudentId === item.id && styles.studentChipActive]}
                  onPress={() => setFormStudentId(item.id)}
                >
                  <Text style={[styles.studentChipText, formStudentId === item.id && styles.studentChipTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          <Text style={styles.formMonthHint}>Mes: {MONTHS[selectedMonth]} {new Date().getFullYear()}</Text>

          <Input
            label="Monto ($)"
            placeholder="20.00"
            value={formAmount}
            onChangeText={setFormAmount}
            keyboardType="decimal-pad"
          />

          <Text style={styles.formLabel}>Estado</Text>
          <View style={styles.statusToggle}>
            <TouchableOpacity
              style={[styles.statusOption, formPaid && styles.statusOptionPaidActive]}
              onPress={() => setFormPaid(true)}
            >
              <Text style={[styles.statusOptionText, formPaid && styles.statusOptionTextActive]}>✓ Cancelado</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusOption, !formPaid && styles.statusOptionPendingActive]}
              onPress={() => setFormPaid(false)}
            >
              <Text style={[styles.statusOptionText, !formPaid && styles.statusOptionTextActive]}>Pendiente</Text>
            </TouchableOpacity>
          </View>

          <Button title="Guardar pago" onPress={handleSavePayment} loading={saving} size="lg" style={styles.saveButton} />
        </Card>
      )}

      {/* Lista de pagos */}
      {payments.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Sin registros"
          message={`No hay pagos registrados para ${MONTHS[selectedMonth]}. Usa "Registrar Pago" para llevar el control.`}
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
>>>>>>> Stashed changes
          )}
        </View>

        {/* ── Filter chips ── */}
        <View style={styles.filterRow}>
          {(['ALL', 'PAID', 'PENDING'] as Filter[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f === 'ALL' ? 'Todos' : f === 'PAID' ? 'Cobrado' : 'Pendiente'}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={{ flex: 1 }} />
          <Text style={styles.countLabel}>{displayedPayments.length} pago{displayedPayments.length !== 1 ? 's' : ''}</Text>
        </View>

        {/* ── Section title ── */}
        <Text style={styles.sectionTitle}>
          {selectedDay !== null
            ? `${selectedDay} de ${MONTHS_FULL[month]}`
            : `${MONTHS_FULL[month]} ${year}`}
        </Text>

        {/* ── Payment list ── */}
        {loading ? (
          <View style={styles.loadingPlaceholder}>
            {[0, 1, 2].map(i => (
              <View key={i} style={styles.skeleton} />
            ))}
          </View>
        ) : displayedPayments.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="payments" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Sin pagos</Text>
            <Text style={styles.emptyMsg}>
              {selectedDay ? `No hay pagos el ${selectedDay} de ${MONTHS_FULL[month]}` : 'Usa + para agregar un pago'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {displayedPayments.map(item => (
              <PaymentItem key={item.id} item={item} onToggle={toggleStatus} onEdit={openEdit} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 80 }]} onPress={openAdd} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* ── Add / Edit Modal ── */}
      <Modal visible={modalVisible} transparent animationType="none" onRequestClose={hideModal}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={hideModal} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideTranslate }] },
          ]}
        >
          {/* Sheet handle */}
          <View style={styles.handle} />

          {/* Modal header */}
          <View style={styles.sheetHeader}>
            {modalStep === 'form' && editingPayment === null && (
              <TouchableOpacity onPress={() => setModalStep('student')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="arrow-back-ios" size={18} color={colors.text} />
              </TouchableOpacity>
            )}
            <Text style={styles.sheetTitle}>
              {editingPayment ? 'Editar pago' : modalStep === 'student' ? 'Seleccionar estudiante' : 'Nuevo pago'}
            </Text>
            {editingPayment ? (
              <TouchableOpacity onPress={deletePayment} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="delete-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 22 }} />
            )}
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* ── Step 1: Student selector ── */}
            {modalStep === 'student' && (
              <>
                <View style={styles.searchWrap}>
                  <MaterialIcons name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar estudiante..."
                    placeholderTextColor={colors.textSecondary}
                    value={studentSearch}
                    onChangeText={setStudentSearch}
                  />
                </View>
                <FlatList
                  data={filteredStudents}
                  keyExtractor={s => s.id}
                  style={{ maxHeight: 280 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.studentRow} onPress={() => selectStudent(item)} activeOpacity={0.7}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.studentName}>{item.name}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.noStudents}>No hay estudiantes registrados</Text>
                  }
                />
              </>
            )}

            {/* ── Step 2: Payment form ── */}
            {modalStep === 'form' && (
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Student chip */}
                {modalStudent && (
                  <View style={styles.selectedStudent}>
                    <View style={styles.studentAvatar}>
                      <Text style={styles.studentAvatarText}>{modalStudent.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.studentName}>{modalStudent.name}</Text>
                    {!editingPayment && (
                      <TouchableOpacity onPress={() => setModalStep('student')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialIcons name="edit" size={16} color={colors.secondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Date row */}
                <Text style={styles.fieldLabel}>Fecha de pago</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => adjustDate(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="chevron-left" size={22} color={colors.text} />
                  </TouchableOpacity>
                  <View style={styles.dateDisplay}>
                    <MaterialIcons name="event" size={16} color={colors.secondary} />
                    <Text style={styles.dateText}>
                      {modalDate
                        ? new Date(modalDate + 'T00:00:00').toLocaleDateString('es-EC', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        : 'Sin fecha'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.dateBtn} onPress={() => adjustDate(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons name="chevron-right" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Amount */}
                <Text style={styles.fieldLabel}>Monto ($)</Text>
                <View style={styles.amountWrap}>
                  <Text style={styles.currencySign}>$</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    value={modalAmount}
                    onChangeText={setModalAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Notes */}
                <Text style={styles.fieldLabel}>Notas (opcional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Observaciones..."
                  placeholderTextColor={colors.textSecondary}
                  value={modalNotes}
                  onChangeText={setModalNotes}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.65 }]}
                  onPress={savePayment}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Guardando...' : editingPayment ? 'Guardar cambios' : 'Agregar pago'}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.primary,
  },
<<<<<<< Updated upstream
  headerRow: {
=======
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
  registerButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  formCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  formLabel: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  formEmpty: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  formMonthHint: {
    fontSize: typography.small.fontSize,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  studentChips: {
    gap: 8,
    paddingBottom: spacing.sm,
  },
  studentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  studentChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  studentChipText: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  studentChipTextActive: {
    color: '#FFFFFF',
  },
  statusToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusOptionPaidActive: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.success,
  },
  statusOptionPendingActive: {
    backgroundColor: '#FFF8E1',
    borderColor: '#F57F17',
  },
  statusOptionText: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusOptionTextActive: {
    color: colors.text,
  },
  saveButton: {
    marginTop: spacing.xs,
  },
  paymentList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
  },
  paymentCard: {
>>>>>>> Stashed changes
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  // Summary
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },

  // Calendar
  calCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: colors.textSecondary, paddingVertical: 4 },
  clearDayBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginTop: 8, paddingVertical: 4,
  },
  clearDayText: { fontSize: 11, color: colors.textSecondary },

  // Filter
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  countLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

  // Section title
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },

  // List
  list: { gap: spacing.sm },
  loadingPlaceholder: { gap: spacing.sm },
  skeleton: { height: 70, borderRadius: 14, backgroundColor: '#E2E8F0' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  emptyMsg: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
  },

  // Modal overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1, textAlign: 'center' },

  // Student search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  studentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 14, fontWeight: '700', color: colors.secondary },
  studentName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  noStudents: { textAlign: 'center', color: colors.textSecondary, paddingVertical: 24, fontSize: 13 },

  // Form
  selectedStudent: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12,
    marginBottom: spacing.md,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.background, borderRadius: 12, padding: 4,
  },
  dateBtn: { padding: 8 },
  dateDisplay: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center',
  },
  dateText: { fontSize: 14, fontWeight: '600', color: colors.text },
  amountWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 2,
  },
  currencySign: { fontSize: 20, fontWeight: '700', color: colors.textSecondary, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text, paddingVertical: 10 },
  notesInput: {
    backgroundColor: colors.background, borderRadius: 12, padding: 12,
    fontSize: 14, color: colors.text, minHeight: 64, textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
