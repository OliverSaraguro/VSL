import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card } from '@/components/common/Card';

const QUICK_MESSAGES = [
  { label: '📍 Ya estoy afuera', message: 'Ya estoy afuera' },
  { label: '⏳ Pequeño retraso', message: 'Pequeño retraso' },
  { label: '🏫 Llegamos', message: 'Llegamos al destino' },
];

const MOCK_STOPS = [
  { id: '1', studentName: 'Valentina Sánchez', estimatedTime: '06:30', address: 'Ciudad Victoria' },
  { id: '2', studentName: 'Sofía González', estimatedTime: '06:38', address: 'Punzara' },
  { id: '3', studentName: 'Mateo Vera', estimatedTime: '06:45', address: 'Centro' },
  { id: '4', studentName: 'Isabella Bravo', estimatedTime: '06:52', address: 'El Valle' },
  { id: '5', studentName: 'Sebastián Cueva', estimatedTime: '06:58', address: 'Zamora Huayco' },
  { id: '6', studentName: 'Daniel Maldonado', estimatedTime: '07:05', address: 'La Argelia' },
];

interface ActiveRouteScreenProps {
  navigation: any;
  route: { params: { routeId: string } };
}

export const ActiveRouteScreen: React.FC<ActiveRouteScreenProps> = ({ navigation }) => {
  const [boarding, setBoarding] = useState<Record<string, boolean>>({});
  const [routeActive, setRouteActive] = useState(true);

  const handleBoarding = (studentId: string) => {
    setBoarding((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const sendQuickMessage = (message: string) => {
    Alert.alert('Enviado', `Mensaje "${message}" enviado a los padres.`);
  };

  const finishRoute = () => {
    Alert.alert('Finalizar ruta', '¿Estás seguro de que quieres finalizar la ruta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: () => {
          setRouteActive(false);
          navigation.goBack();
        },
      },
    ]);
  };

  const boardedCount = Object.values(boarding).filter(Boolean).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <StatusBadge status="ACTIVA" />
          <Text style={styles.headerTitle}>Ruta en curso</Text>
        </View>
        <Text style={styles.counter}>
          {boardedCount}/{MOCK_STOPS.length}
        </Text>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>Seguimiento GPS activo</Text>
        <Text style={styles.mapSubtext}>Loja, Ecuador</Text>
      </View>

      {/* Panel inferior */}
      <ScrollView style={styles.panel} showsVerticalScrollIndicator={false}>
        {/* Mensajes rápidos */}
        <View style={styles.quickMessages}>
          {QUICK_MESSAGES.map((qm) => (
            <TouchableOpacity
              key={qm.message}
              style={styles.quickMessageBtn}
              onPress={() => sendQuickMessage(qm.message)}
            >
              <Text style={styles.quickMessageText}>{qm.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista de abordaje */}
        <Text style={styles.sectionTitle}>Abordaje</Text>
        {MOCK_STOPS.map((stop) => (
          <Card key={stop.id} style={styles.boardingRow}>
            <View style={styles.boardingInfo}>
              <Text style={styles.boardingName}>{stop.studentName}</Text>
              <Text style={styles.boardingTime}>{stop.estimatedTime} · {stop.address}</Text>
            </View>
            <TouchableOpacity
              style={[styles.boardBtn, boarding[stop.id] && styles.boardBtnActive]}
              onPress={() => handleBoarding(stop.id)}
            >
              <Text style={[styles.boardBtnText, boarding[stop.id] && styles.boardBtnTextActive]}>
                {boarding[stop.id] ? '✓ Abordó' : 'Registrar'}
              </Text>
            </TouchableOpacity>
          </Card>
        ))}

        {/* Finalizar */}
        <Button
          title="Finalizar Ruta"
          onPress={finishRoute}
          variant="danger"
          size="lg"
          style={styles.finishButton}
        />
      </ScrollView>
    </View>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text },
  counter: { fontSize: typography.h2.fontSize, fontWeight: '800', color: colors.primary },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.2,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapEmoji: { fontSize: 40 },
  mapText: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  mapSubtext: { fontSize: typography.small.fontSize, color: colors.textSecondary },
  panel: { flex: 1, paddingHorizontal: spacing.lg },
  quickMessages: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.md },
  quickMessageBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  quickMessageText: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  sectionTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  boardingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, marginBottom: spacing.sm },
  boardingInfo: { flex: 1, marginRight: spacing.md },
  boardingName: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  boardingTime: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginTop: 2 },
  boardBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0' },
  boardBtnActive: { backgroundColor: '#E8F5E9', borderColor: colors.success },
  boardBtnText: { fontSize: typography.small.fontSize, fontWeight: '600', color: colors.textSecondary },
  boardBtnTextActive: { color: colors.success },
  finishButton: { marginTop: spacing.xl, marginBottom: 32 },
});
