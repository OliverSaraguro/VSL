import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { RouteMap } from '@/components/maps/RouteMap';
import { supabase } from '@/config/supabase';
import studentsService from '@/servicios/students.service';
import routesService from '@/servicios/routes.service';
import trackingService from '@/servicios/tracking.service';
import { distanceMeters } from '@/utils/geo';
import type { Coordinates, Route, Student, Trip, TripStatus } from '@/types';

interface TrackingScreenProps {
  navigation: any;
}

// Cada cuánto reconsultamos si ya inició/terminó un viaje mientras el padre tiene la pantalla
// abierta (el broadcast de posición solo llega si ya hay un canal de Supabase Realtime conectado).
const POLL_INTERVAL_MS = 10000;

function statusToBadge(status?: TripStatus): 'ACTIVA' | 'EN_PAUSA' | 'FINALIZADA' {
  if (status === 'in_progress') return 'ACTIVA';
  if (status === 'paused') return 'EN_PAUSA';
  return 'FINALIZADA';
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export const TrackingScreen: React.FC<TrackingScreenProps> = () => {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Student | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [busPosition, setBusPosition] = useState<Coordinates | null>(null);
  const [lastUpdateAt, setLastUpdateAt] = useState<string | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);

  const connectedTripId = useRef<string | null>(null);

  const connectToTrip = useCallback((newTrip: Trip | null) => {
    if (newTrip?.id === connectedTripId.current) return;

    trackingService.disconnect();
    connectedTripId.current = null;
    setLiveConnected(false);
    setBusPosition(null);

    if (!newTrip || newTrip.status === 'completed' || newTrip.status === 'cancelled') return;

    connectedTripId.current = newTrip.id;
    trackingService.connect(newTrip.id, newTrip.id);
    trackingService.on('location_update', (payload: any) => {
      setBusPosition(payload.coordinates);
      setLastUpdateAt(payload.timestamp);
    });
    trackingService.on('connected', () => setLiveConnected(true));
    trackingService.on('disconnected', () => setLiveConnected(false));
  }, []);

  const refresh = useCallback(async (initial = false) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const students = await studentsService.getByParent(authUser.id);
      if (students.length === 0) {
        setStudent(null);
        return;
      }
      const myStudent = students[0];
      setStudent(myStudent);

      const [routeData, tripData] = await Promise.all([
        routesService.getTodayRouteByDriver(myStudent.driverId),
        routesService.getActiveTripByDriver(myStudent.driverId),
      ]);

      setRoute(routeData);
      setTrip(tripData);
      connectToTrip(tripData);
    } catch {
      // Silencioso: la pantalla simplemente queda en su último estado conocido
    } finally {
      if (initial) setLoading(false);
    }
  }, [connectToTrip]);

  useEffect(() => {
    refresh(true);
    const interval = setInterval(() => refresh(false), POLL_INTERVAL_MS);
    return () => {
      clearInterval(interval);
      trackingService.disconnect();
      connectedTripId.current = null;
    };
  }, [refresh]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Buscando la ruta de tu hijo/a...</Text>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🚌</Text>
        <Text style={styles.emptyTitle}>Aún no tienes un estudiante vinculado</Text>
        <Text style={styles.emptyText}>
          Pide al conductor el código de invitación y vincúlalo desde tu Perfil.
        </Text>
      </View>
    );
  }

  const myStop = route?.stops.find((s) => (s.studentId ?? s.students?.[0]?.id) === student.id);
  const alreadyBoarded = !!trip?.boardings?.some((b) => b.studentId === student.id);
  const badge = statusToBadge(trip?.status);

  const distance = busPosition && myStop ? distanceMeters(busPosition, myStop) : null;
  // Estimación simple a ~25 km/h promedio urbano, solo para dar una referencia al padre.
  const etaMinutes = distance != null ? Math.max(1, Math.round((distance / 1000 / 25) * 60)) : null;

  const routePath = (route?.stops || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ latitude: s.latitude, longitude: s.longitude }));

  return (
    <View style={styles.container}>
      <RouteMap
        stops={(route?.stops || []).map((s) => ({ ...s, studentName: s.name }))}
        routePath={routePath}
        busPosition={busPosition}
      />

      <View style={styles.infoOverlay}>
        <Card style={styles.infoCard}>
          <View style={styles.liveRow}>
            <StatusBadge status={badge} />
            {trip && (
              <View style={styles.liveDotRow}>
                <View style={[styles.liveDot, { backgroundColor: liveConnected ? colors.error : colors.textSecondary }]} />
                <Text style={styles.liveText}>{liveConnected ? 'En vivo' : 'Reconectando...'}</Text>
              </View>
            )}
          </View>

          {!trip && (
            <Text style={styles.noTripText}>
              El recorrido de hoy todavía no inicia o ya finalizó. Aquí verás la posición de la
              buseta en cuanto el conductor lo active.
            </Text>
          )}

          {trip && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Tu parada</Text>
                <Text style={styles.infoValue}>
                  {alreadyBoarded ? '✅ Ya abordó' : myStop?.address ?? '—'}
                </Text>
              </View>
              <View style={styles.infoDivider} />
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ETA aprox.</Text>
                <Text style={styles.infoValueBig}>
                  {etaMinutes != null ? `~${etaMinutes} min` : '—'}
                </Text>
              </View>
            </View>
          )}

          {lastUpdateAt && (
            <View style={styles.driverRow}>
              <Text style={styles.driverText}>
                {liveConnected ? 'Actualizado' : 'Última posición conocida'}: {formatTime(lastUpdateAt)}
              </Text>
            </View>
          )}
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: typography.body.fontSize, color: colors.textSecondary },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
  infoCard: { borderRadius: 20 },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  liveDotRow: { flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  liveText: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.text },
  noTripText: { fontSize: typography.small.fontSize, color: colors.textSecondary, lineHeight: 18 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  infoItem: { flex: 1 },
  infoDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },
  infoLabel: { fontSize: typography.small.fontSize, color: colors.textSecondary },
  infoValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, marginTop: 2 },
  infoValueBig: { fontSize: typography.h3.fontSize, fontWeight: '800', color: colors.primary, marginTop: 2 },
  driverRow: { borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: spacing.sm },
  driverText: { fontSize: typography.small.fontSize, color: colors.textSecondary },
});
