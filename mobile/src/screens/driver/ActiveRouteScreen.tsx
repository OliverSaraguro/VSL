import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card } from '@/components/common/Card';
import routesService from '@/servicios/routes.service';
import trackingService from '@/servicios/tracking.service';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth.store';
import type { Stop, Trip } from '@/types';

const QUICK_MESSAGES = [
  { label: '📍 Ya estoy afuera', message: 'Ya estoy afuera' },
  { label: '⏳ Pequeño retraso', message: 'Pequeño retraso' },
  { label: '🏫 Llegamos', message: 'Llegamos al destino' },
];

interface ActiveRouteScreenProps {
  navigation: any;
  route: any;
}

export const ActiveRouteScreen: React.FC<ActiveRouteScreenProps> = ({ navigation, route: navRoute }) => {
  const routeId: string | undefined = navRoute?.params?.routeId;
  const { user } = useAuthStore();

  const [stops, setStops] = useState<Stop[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [boarding, setBoarding] = useState<Record<string, boolean>>({});
  const [loadingInit, setLoadingInit] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const { location, startTracking, stopTracking } = useLocation({ trackingInterval: 5000, distanceFilter: 10 });

  const initRoute = useCallback(async () => {
    if (!routeId) {
      setLoadingInit(false);
      return;
    }
    try {
      const [routeData, existingTrip] = await Promise.all([
        routesService.getById(routeId),
        routesService.getActiveTrip(),
      ]);
      setStops(routeData.stops || []);

      const trip = existingTrip ?? await routesService.startTrip(routeId);
      setActiveTrip(trip);

      const boardingMap: Record<string, boolean> = {};
      (trip.boardings || []).forEach((b) => { boardingMap[b.studentId] = true; });
      setBoarding(boardingMap);

      trackingService.connect(trip.id, trip.id);
      startTracking();
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo iniciar la ruta: ' + (err?.message || ''));
    } finally {
      setLoadingInit(false);
    }
  }, [routeId, startTracking]);

  useEffect(() => {
    initRoute();
    return () => {
      stopTracking();
      trackingService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!location || !activeTrip || !user) return;
    trackingService.sendLocation({
      tripId: activeTrip.id,
      driverId: user.id,
      coordinates: location,
      timestamp: new Date().toISOString(),
    });
  }, [location, activeTrip, user]);

  const handleBoarding = async (stop: Stop) => {
    if (!activeTrip) return;
    const studentId = stop.studentId ?? stop.students?.[0]?.id;
    if (!studentId) return;

    const alreadyBoarded = boarding[studentId];
    setBoarding((prev) => ({ ...prev, [studentId]: !alreadyBoarded }));

    try {
      if (!alreadyBoarded) {
        await trackingService.sendBoarding(activeTrip.id, studentId, stop.id, location ?? undefined);
      } else {
        await trackingService.sendDropoff(activeTrip.id, studentId, stop.id, location ?? undefined);
      }
    } catch (err: any) {
      console.error('[ActiveRouteScreen] handleBoarding', err);
      setBoarding((prev) => ({ ...prev, [studentId]: alreadyBoarded }));
      Alert.alert('Error', err?.message || 'No se pudo registrar el abordaje.');
    }
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
        onPress: async () => {
          if (!activeTrip) { navigation.goBack(); return; }
          setFinishing(true);
          try {
            await routesService.completeTrip(activeTrip.id);
          } catch {}
          stopTracking();
          trackingService.disconnect();
          navigation.goBack();
        },
      },
    ]);
  };

  if (loadingInit) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Iniciando ruta...</Text>
      </View>
    );
  }

  const boardedCount = Object.values(boarding).filter(Boolean).length;
  const totalStudents = stops.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <StatusBadge status="ACTIVA" />
          <Text style={styles.headerTitle}>Ruta en curso</Text>
        </View>
        <Text style={styles.counter}>
          {boardedCount}/{totalStudents}
        </Text>
      </View>

      {/* Ubicación actual */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>Seguimiento GPS activo</Text>
        {location ? (
          <Text style={styles.mapSubtext}>
            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </Text>
        ) : (
          <Text style={styles.mapSubtext}>Obteniendo ubicación...</Text>
        )}
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
        {stops.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Esta ruta no tiene paradas configuradas.</Text>
          </Card>
        ) : (
          stops.map((stop) => {
            const studentId = stop.studentId ?? stop.students?.[0]?.id ?? '';
            const studentName = stop.name || stop.students?.[0]?.name || 'Sin nombre';
            const boarded = !!boarding[studentId];
            return (
              <Card key={stop.id} style={styles.boardingRow}>
                <View style={styles.boardingInfo}>
                  <Text style={styles.boardingName}>{studentName}</Text>
                  <Text style={styles.boardingTime}>
                    {stop.estimatedTime} · {stop.address}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.boardBtn, boarded && styles.boardBtnActive]}
                  onPress={() => handleBoarding(stop)}
                  disabled={!studentId}
                >
                  <Text style={[styles.boardBtnText, boarded && styles.boardBtnTextActive]}>
                    {boarded ? '✓ Abordó' : 'Registrar'}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}

        {/* Finalizar */}
        <Button
          title={finishing ? 'Finalizando...' : 'Finalizar Ruta'}
          onPress={finishRoute}
          variant="danger"
          size="lg"
          disabled={finishing}
          style={styles.finishButton}
        />
      </ScrollView>
    </View>
  );
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: spacing.md, fontSize: typography.body.fontSize, color: colors.textSecondary },
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
  emptyCard: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
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
