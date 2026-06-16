import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import studentsService from '@/servicios/students.service';
import { supabase } from '@/config/supabase';

interface AbsenceScreenProps {
  navigation: any;
}

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const isWithinAllowedHours = (): boolean => {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  // 8pm (20:00) a 5:30am
  return hour >= 20 || hour < 5 || (hour === 5 && minutes <= 30);
};

const getDaysInMonth = (year: number, month: number): number =>
  new Date(year, month + 1, 0).getDate();

const getFirstDayOfMonth = (year: number, month: number): number =>
  new Date(year, month, 1).getDay();

export const AbsenceScreen: React.FC<AbsenceScreenProps> = ({ navigation }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [loading, setLoading] = useState(false);
  const [registeredDates, setRegisteredDates] = useState<string[]>([]);

  const allowed = isWithinAllowedHours();

  const daysInMonth = useMemo(
    () => getDaysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );
  const firstDay = useMemo(
    () => getFirstDayOfMonth(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString('es-EC', {
    month: 'long',
    year: 'numeric',
  });

  const navigateMonth = (delta: number) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const handleSelectDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (date < today && date.toDateString() !== today.toDateString()) return;
    setSelectedDate(date);
  };

  const handleRegister = async () => {
    if (!selectedDate) return;
    if (!allowed) {
      Alert.alert(
        'Horario no permitido',
        'Las ausencias solo pueden registrarse entre las 8:00 PM y las 5:30 AM.'
      );
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const students = await studentsService.getByParent(user.id);
      if (students.length === 0) {
        Alert.alert('Sin estudiantes', 'No tienes estudiantes registrados asociados a tu cuenta.');
        return;
      }

      const dateStr = selectedDate.toISOString().split('T')[0];
      await studentsService.reportAbsence({
        studentId: students[0].id,
        registeredBy: user.id,
        date: dateStr,
        reason: 'Ausencia registrada por padre/madre',
      });

      setRegisteredDates((prev) => [...prev, dateStr]);
      Alert.alert('Ausencia registrada', `Se ha registrado la ausencia para el ${selectedDate.toLocaleDateString('es-EC')}.`);
      setSelectedDate(null);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo registrar la ausencia.');
    } finally {
      setLoading(false);
    }
  };

  const renderCalendar = () => {
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const isRegistered = registeredDates.includes(dateStr);
      const isPast = date < today && !isToday;

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.dayCellToday,
            isSelected && styles.dayCellSelected,
            isRegistered && styles.dayCellRegistered,
          ]}
          onPress={() => handleSelectDate(day)}
          disabled={isPast}
          accessibilityLabel={`${day} de ${monthLabel}`}
        >
          <Text
            style={[
              styles.dayText,
              isPast && styles.dayTextPast,
              isSelected && styles.dayTextSelected,
              isRegistered && styles.dayTextRegistered,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={styles.container}>
      <Header title="Registrar Ausencia" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Aviso de horario */}
        <Card style={StyleSheet.flatten([styles.timeCard, !allowed && styles.timeCardWarning])}>
          <Text style={styles.timeIcon}>{allowed ? '✅' : '⏰'}</Text>
          <Text style={[styles.timeText, !allowed && styles.timeTextWarning]}>
            {allowed
              ? 'Estás dentro del horario permitido (8PM - 5:30AM)'
              : 'Fuera de horario. Solo puedes registrar ausencias entre 8:00 PM y 5:30 AM.'}
          </Text>
        </Card>

        {/* Calendario */}
        <Card>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <Text style={styles.navArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <Text style={styles.navArrow}>→</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekHeader}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={styles.weekDay}>{d}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>{renderCalendar()}</View>
        </Card>

        {selectedDate && (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedText}>
              Fecha seleccionada: {selectedDate.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
            <Button
              title="Registrar ausencia"
              onPress={handleRegister}
              loading={loading}
              disabled={!allowed}
              size="lg"
              style={styles.registerButton}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: '#E8F5E9',
  },
  timeCardWarning: {
    backgroundColor: '#FFF3E0',
  },
  timeIcon: {
    fontSize: 20,
  },
  timeText: {
    flex: 1,
    fontSize: typography.small.fontSize,
    color: colors.primary,
    fontWeight: '500',
  },
  timeTextWarning: {
    color: '#E65100',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navArrow: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
    padding: spacing.sm,
  },
  monthTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  weekDay: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: typography.small.fontSize,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayCellSelected: {
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  dayCellRegistered: {
    borderRadius: 22,
    backgroundColor: '#FFCDD2',
  },
  dayText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextPast: {
    color: '#BDBDBD',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextRegistered: {
    color: colors.error,
    fontWeight: '700',
  },
  selectedInfo: {
    marginTop: spacing.lg,
  },
  selectedText: {
    fontSize: typography.body.fontSize,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: spacing.md,
  },
  registerButton: {
    marginTop: 0,
  },
});
