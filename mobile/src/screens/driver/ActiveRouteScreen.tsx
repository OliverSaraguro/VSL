import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing } from '@/config/theme';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Card } from '@/components/common/Card';
import routesService from '@/servicios/routes.service';
import trackingService from '@/servicios/tracking.service';
import studentsService from '@/servicios/students.service';
import messagesService from '@/servicios/messages.service';
import notificationsService from '@/servicios/notifications.service';
import trafficService, { TrafficAlert } from '@/servicios/traffic.service';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth.store';
import { distanceToRouteMeters } from '@/utils/geo';
import { LOW_POWER_MODE_KEY } from '@/config/lowPowerMode';
import type { Stop, Trip } from '@/types';

const QUICK_MESSAGES = [
  { label: '📍 Ya estoy afuera', message: 'Ya estoy afuera' },
  { label: '⏳ Pequeño retraso', message: 'Pequeño retraso' },
  { label: '🏫 Llegamos', message: 'Llegamos al destino' },
];

const DEVIATION_THRESHOLD_METERS = 300;
const DELAY_THRESHOLD_MINUTES = 10;

interface ActiveRouteScreenProps {
  navigation: any;
  route: any;
}

function parseEstimatedTimeToday(estimatedTime: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(estimatedTime || '');
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

function getStudentId(stop: Stop): string | undefined {
  return stop.studentId ?? stop.students?.[0]?.id;
}

function getParentId(stop: Stop): string | undefined {
  return stop.students?.[0]?.parentId ?? undefined;
}

export const ActiveRouteScreen: React.FC<ActiveRouteScreenProps> = ({ navigation, route: navRoute }) => {
  const routeId: string | undefined = navRoute?.params?.routeId;
  const { user } = useAuthStore();

  const [stops, setStops] = useState<Stop[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [boarding, setBoarding] = useState<Record<string, boolean>>({});
  const [absentCount, setAbsentCount] = useState(0);
  const [loadingInit, setLoadingInit] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [trafficAlerts, setTrafficAlerts] = useState<TrafficAlert[]>([]);

  const deviationActiveRef = useRef(false);
  const delayAlertedRef = useRef<Set<string>>(new Set());
  const tripStartRef = useRef<Date | null>(null);

  const { location, startTracking, stopTracking } = useLocation({
    trackingInterval: lowPower ? 15000 : 5000,
    distanceFilter: lowPower ? 30 : 10,
  });

  useEffect(() => {
    AsyncStorage.getItem(LOW_POWER_MODE_KEY).then((value) => {
      setLowPower(value === 'true');
      setPrefsLoaded(true);
    });
  }, []);

  const initRoute = useCallback(async () => {
    if (!routeId) {
      setLoadingInit(false);
      return;
    }
    try {
      const [routeData, existingTrip, alerts] = await Promise.all([
        routesService.getById(routeId),
        routesService.getActiveTrip(),
        trafficService.getActiveForRoute(routeId).catch(() => []),
      ]);
      setTrafficAlerts(alerts);

      // HU18: las paradas de estudiantes con ausencia registrada HOY se quitan de la lista activa.
      const allStops = routeData.stops || [];
      const studentIds = allStops.map(getStudentId).filter(Boolean) as string[];
      const today = new Date().toISOString().split('T')[0];
      const absentIds = await studentsService.getAbsentStudentIds(studentIds, today).catch(() => new Set<string>());
      const activeStops = allStops.filter((s) => {
        const sid = getStudentId(s);
        return !sid || !absentIds.has(sid);
      });
      setStops(activeStops);
      setAbsentCount(allStops.length - activeStops.length);

      const trip = existingTrip ?? await routesService.startTrip(routeId);
      setActiveTrip(trip);
      tripStartRef.current = trip.startedAt ? new Date(trip.startedAt) : new Date();

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
    if (!prefsLoaded) return;
    initRoute();
    return () => {
      stopTracking();
      trackingService.disconnect();
    };
  }, [prefsLoaded]);

  // Transmite el GPS y evalúa desvío (>300 m de la ruta planificada) y retraso (>10 min) en
  // cada actualización de posición (HU08, HU11, HU12).
  useEffect(() => {
    if (!location || !activeTrip || !user) return;

    trackingService.sendLocation({
      tripId: activeTrip.id,
      driverId: user.id,
      coordinates: location,
      timestamp: new Date().toISOString(),
    });

    const pendingStops = stops.filter((s) => {
      const sid = getStudentId(s);
      return sid && !boarding[sid];
    });
    if (pendingStops.length === 0) return;

    // Desvío: distancia mínima a la poligonal de paradas pendientes
    const path = pendingStops
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ latitude: s.latitude, longitude: s.longitude }));
    const deviation = distanceToRouteMeters(location, path);

    if (deviation > DEVIATION_THRESHOLD_METERS && !deviationActiveRef.current) {
      deviationActiveRef.current = true;
      const parentIds = Array.from(
        new Set(pendingStops.map(getParentId).filter(Boolean) as string[]),
      );
      notificationsService.createMany(
        parentIds,
        'Desvío de ruta detectado',
        `La buseta se desvió de la ruta planificada (~${Math.round(deviation)} m). Puedes ver su posición en el mapa.`,
        'route_updated',
        { tripId: activeTrip.id, deviationMeters: Math.round(deviation) },
      );
    } else if (deviation <= DEVIATION_THRESHOLD_METERS) {
      deviationActiveRef.current = false;
    }

    // Retraso: compara la hora estimada de la próxima parada pendiente contra la hora actual
    const nextStop = pendingStops.slice().sort((a, b) => a.order - b.order)[0];
    const estimated = parseEstimatedTimeToday(nextStop.estimatedTime);
    const sid = getStudentId(nextStop);
    if (estimated && sid && !delayAlertedRef.current.has(sid)) {
      const minutesLate = (Date.now() - estimated.getTime()) / 60000;
      if (minutesLate > DELAY_THRESHOLD_MINUTES) {
        delayAlertedRef.current.add(sid);
        const parentId = getParentId(nextStop);
        if (parentId) {
          notificationsService.create(
            parentId,
            'Retraso en la ruta',
            `La buseta lleva aproximadamente ${Math.round(minutesLate)} min de retraso respecto al horario estimado de ${nextStop.address}.`,
            'route_updated',
            { tripId: activeTrip.id, stopId: nextStop.id, delayMinutes: Math.round(minutesLate) },
          );
        }
      }
    }
  }, [location, activeTrip, user, stops, boarding]);

  const handleBoarding = async (stop: Stop) => {
    if (!activeTrip) return;
    const studentId = getStudentId(stop);
    if (!studentId) return;

    const alreadyBoarded = boarding[studentId];
    setBoarding((prev) => ({ ...prev, [studentId]: !alreadyBoarded }));

    try {
      if (!alreadyBoarded) {
        await trackingService.sendBoarding(activeTrip.id, studentId, stop.id, location ?? undefined);
        delayAlertedRef.current.delete(studentId);

        // HU14: notifica al padre con nombre, hora y dirección apenas se registra el abordaje.
        const parentId = getParentId(stop);
        const studentName = stop.name || stop.students?.[0]?.name || 'Tu hijo/a';
        if (parentId) {
          await notificationsService.create(
            parentId,
            `${studentName} abordó la buseta`,
            `Hora: ${new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} · Cerca de ${stop.address}`,
            'student_boarded',
            { tripId: activeTrip.id, studentId, stopId: stop.id },
          );
        }
      } else {
        await trackingService.sendDropoff(activeTrip.id, studentId, stop.id, location ?? undefined);
      }
    } catch (err: any) {
      console.error('[ActiveRouteScreen] handleBoarding', err);
      setBoarding((prev) => ({ ...prev, [studentId]: alreadyBoarded }));
      Alert.alert('Error', err?.message || 'No se pudo registrar el abordaje.');
    }
  };

  const sendQuickMessage = async (message: string) => {
    if (!activeTrip || !routeId || !user) return;
    try {
      await messagesService.send(routeId, user.id, message);
      const parentIds = Array.from(new Set(stops.map(getParentId).filter(Boolean) as string[]));
      await notificationsService.createMany(parentIds, 'Mensaje del conductor', message, 'general', {
        routeId,
      });
      Alert.alert('Enviado', `Mensaje "${message}" enviado a los padres.`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo enviar el mensaje.');
    }
  };

  const handleReportIncident = () => {
    if (!routeId || !location) {
      Alert.alert('Sin ubicación', 'Espera a que el GPS detecte tu posición para reportar.');
      return;
    }
    Alert.alert('Reportar incidencia', '¿Qué tipo de incidencia hay en la vía?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cierre de vía',
        onPress: () => createIncident('Cierre de vía reportado por el conductor'),
      },
      {
        text: 'Accidente / tráfico',
        onPress: () => createIncident('Accidente o tráfico denso reportado por el conductor'),
      },
    ]);
  };

  const createIncident = async (description: string) => {
    if (!routeId || !location) return;
    try {
      const alert = await trafficService.report(routeId, description, location);
      setTrafficAlerts((prev) => [alert, ...prev]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo reportar la incidencia.');
    }
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

            // HU15: notificar llegada a todos los padres de la ruta. HU20: resumen de cierre.
            const boardedCount = Object.values(boarding).filter(Boolean).length;
            const startedAt = tripStartRef.current ?? new Date();
            const finishedAt = new Date();
            const durationMin = Math.round((finishedAt.getTime() - startedAt.getTime()) / 60000);

            const parentIds = Array.from(new Set(stops.map(getParentId).filter(Boolean) as string[]));
            await notificationsService.createMany(
              parentIds,
              'La buseta llegó al destino',
              `Hora de llegada: ${finishedAt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}.`,
              'trip_completed',
              { tripId: activeTrip.id },
            ).catch(() => {});

            stopTracking();
            trackingService.disconnect();

            Alert.alert(
              'Resumen del recorrido',
              `Transportados: ${boardedCount}/${stops.length}\n` +
              `Ausentes hoy: ${absentCount}\n` +
              `Inicio: ${startedAt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}\n` +
              `Llegada: ${finishedAt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}\n` +
              `Duración: ${durationMin} min`,
              [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
          } catch {
            stopTracking();
            trackingService.disconnect();
            navigation.goBack();
          }
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

      {absentCount > 0 && (
        <View style={styles.absentBanner}>
          <Text style={styles.absentBannerText}>
            🚫 {absentCount} estudiante{absentCount > 1 ? 's' : ''} ausente{absentCount > 1 ? 's' : ''} hoy — ya no aparece{absentCount > 1 ? 'n' : ''} en la lista
          </Text>
        </View>
      )}

      {trafficAlerts.length > 0 && (
        <View style={styles.trafficBanner}>
          <Text style={styles.trafficBannerText}>🚧 {trafficAlerts[0].description}</Text>
        </View>
      )}

      {/* Ubicación actual */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapEmoji}>🗺️</Text>
        <Text style={styles.mapText}>
          Seguimiento GPS activo {lowPower ? '(modo bajo consumo: 15s)' : '(5s)'}
        </Text>
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

        <TouchableOpacity style={styles.incidentBtn} onPress={handleReportIncident}>
          <Text style={styles.incidentBtnText}>🚧 Reportar incidencia de tráfico</Text>
        </TouchableOpacity>

        {/* Lista de abordaje */}
        <Text style={styles.sectionTitle}>Abordaje</Text>
        {stops.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>Esta ruta no tiene paradas activas configuradas.</Text>
          </Card>
        ) : (
          stops.map((stop) => {
            const studentId = getStudentId(stop) ?? '';
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
  absentBanner: { backgroundColor: '#FFF3E0', paddingVertical: 6, paddingHorizontal: spacing.lg },
  absentBannerText: { fontSize: typography.small.fontSize, color: '#E65100', fontWeight: '600' },
  trafficBanner: { backgroundColor: '#FFEBEE', paddingVertical: 6, paddingHorizontal: spacing.lg },
  trafficBannerText: { fontSize: typography.small.fontSize, color: colors.error, fontWeight: '600' },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.18,
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
  incidentBtn: {
    paddingVertical: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  incidentBtnText: { fontSize: 13, fontWeight: '700', color: '#E65100' },
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
