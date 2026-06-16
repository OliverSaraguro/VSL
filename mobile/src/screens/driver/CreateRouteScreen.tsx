import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import routesService from '@/servicios/routes.service';
import studentsService from '@/servicios/students.service';
import notificationsService from '@/servicios/notifications.service';
import { distanceMeters } from '@/utils/geo';
import { useLocation } from '@/hooks/useLocation';
import { Student, Coordinates } from '@/types';

interface CreateRouteScreenProps {
  navigation: any;
  route?: { params?: { routeId?: string } };
}

interface LocalStop {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  order: number;
  studentId: string;
  studentName: string;
  parentId?: string;
  isNew: boolean;
}

const DEFAULT_REGION = {
  latitude: -3.99313,
  longitude: -79.20456,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

// HU04: mínimo 1, máximo 50 paradas por ruta.
const MIN_STOPS = 1;
const MAX_STOPS = 50;

// HU04: el horario estimado de cada parada se calcula según la distancia real recorrida desde
// la parada anterior (Haversine) a una velocidad promedio urbana, más un tiempo fijo de abordaje
// por parada — en vez de una fórmula arbitraria basada solo en el número de orden.
const AVG_SPEED_KMH = 25;
const DWELL_MINUTES_PER_STOP = 1;
const ROUTE_START_MINUTES = 6 * 60; // 06:00

function formatClock(totalMinutesFromMidnight: number): string {
  const mins = Math.round(totalMinutesFromMidnight);
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function computeEstimatedTimes(origin: Coordinates | null, orderedStops: LocalStop[]): string[] {
  let elapsedMinutes = 0;
  let prevPoint: Coordinates | null = origin;
  return orderedStops.map((stop) => {
    if (prevPoint) {
      const meters = distanceMeters(prevPoint, stop);
      elapsedMinutes += (meters / 1000 / AVG_SPEED_KMH) * 60;
    }
    elapsedMinutes += DWELL_MINUTES_PER_STOP;
    prevPoint = stop;
    return formatClock(ROUTE_START_MINUTES + elapsedMinutes);
  });
}

export const CreateRouteScreen: React.FC<CreateRouteScreenProps> = ({ navigation, route: navRoute }) => {
  const existingRouteId = navRoute?.params?.routeId;
  const isEditMode = !!existingRouteId;

  const [name, setName] = useState('');
  const [stops, setStops] = useState<LocalStop[]>([]);
  const [nameError, setNameError] = useState('');

  // Destino final (ej. el colegio)
  const [destinationName, setDestinationName] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<Coordinates | null>(null);
  const [destinationError, setDestinationError] = useState('');

  // Estudiantes disponibles (cargados desde Supabase, ya con su casa guardada)
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(isEditMode);

  const [loading, setLoading] = useState(false);
  const [removedStopIds, setRemovedStopIds] = useState<string[]>([]);

  // Padres a notificar al guardar (HU05): se acumulan los de cada estudiante agregado o quitado
  // durante esta edición — no hace falta avisar a toda la ruta, solo a los afectados.
  const affectedParentIdsRef = useRef<Set<string>>(new Set());

  const { location: origin, getCurrentLocation } = useLocation();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    async function loadStudents() {
      try {
        const list = await studentsService.getAll();
        setStudents(list);
      } catch (err: any) {
        Alert.alert('Error', 'No se pudieron cargar los estudiantes: ' + err.message);
      } finally {
        setLoadingStudents(false);
      }
    }
    loadStudents();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    async function loadRoute() {
      try {
        const existing = await routesService.getById(existingRouteId!);
        setName(existing.name);
        if (existing.destinationLatitude && existing.destinationLongitude) {
          setDestinationCoords({ latitude: existing.destinationLatitude, longitude: existing.destinationLongitude });
        }
        setDestinationName(existing.destinationName || '');
        setStops(
          existing.stops.map((s) => ({
            id: s.id,
            address: s.address,
            latitude: s.latitude,
            longitude: s.longitude,
            order: s.order,
            studentId: s.studentId || s.students?.[0]?.id || '',
            studentName: s.students?.[0]?.name || s.name,
            parentId: s.students?.[0]?.parentId,
            isNew: false,
          })),
        );
      } catch (err: any) {
        Alert.alert('Error', 'No se pudo cargar la ruta: ' + err.message);
      } finally {
        setLoadingRoute(false);
      }
    }
    loadRoute();
  }, [isEditMode, existingRouteId]);

  const handleMapPress = (e: any) => {
    setDestinationCoords(e.nativeEvent.coordinate);
    setDestinationError('');
    if (!destinationName.trim()) {
      setDestinationName('Colegio / destino final');
    }
  };

  const availableStudents = students.filter((st) => !stops.some((s) => s.studentId === st.id));

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.order - b.order), [stops]);
  const estimatedTimes = useMemo(
    () => computeEstimatedTimes(origin, sortedStops),
    [origin, sortedStops],
  );

  const addStop = (student: Student) => {
    if (!student.latitude || !student.longitude) {
      Alert.alert(
        'Sin ubicación',
        `${student.name} no tiene una casa marcada en el mapa. Edita su registro para marcarla.`,
      );
      return;
    }
    if (stops.length >= MAX_STOPS) {
      Alert.alert('Límite de paradas', `Una ruta admite máximo ${MAX_STOPS} paradas.`);
      return;
    }
    const stop: LocalStop = {
      id: `local-${Date.now()}`,
      address: student.address,
      latitude: student.latitude,
      longitude: student.longitude,
      order: stops.length + 1,
      studentId: student.id,
      studentName: student.name,
      parentId: student.parentId,
      isNew: true,
    };
    if (isEditMode && student.parentId) affectedParentIdsRef.current.add(student.parentId);
    setStops((prev) => [...prev, stop]);
  };

  const removeStop = (id: string) => {
    setStops((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) {
        if (!target.isNew) setRemovedStopIds((ids) => [...ids, target.id]);
        if (isEditMode && target.parentId) affectedParentIdsRef.current.add(target.parentId);
      }
      return prev
        .filter((s) => s.id !== id)
        .sort((a, b) => a.order - b.order)
        .map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  // HU05: reordenar paradas con flechas (sin agregar una librería de drag & drop nueva).
  const moveStop = (id: string, direction: 'up' | 'down') => {
    setStops((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((s) => s.id === id);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || swapWith < 0 || swapWith >= sorted.length) return prev;
      const orderA = sorted[idx].order;
      const orderB = sorted[swapWith].order;
      return sorted.map((s, i) => {
        if (i === idx) return { ...s, order: orderB };
        if (i === swapWith) return { ...s, order: orderA };
        return s;
      });
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('El nombre de la ruta es obligatorio');
      return;
    }
    if (!destinationCoords) {
      setDestinationError('Toca el mapa para marcar el destino final (ej. el colegio)');
      return;
    }
    // HU04: entre 1 y 50 paradas.
    if (sortedStops.length < MIN_STOPS) {
      Alert.alert('Atención', 'Agrega al menos un estudiante a la ruta.');
      return;
    }
    if (sortedStops.length > MAX_STOPS) {
      Alert.alert('Atención', `Una ruta admite máximo ${MAX_STOPS} paradas.`);
      return;
    }

    setLoading(true);
    try {
      const routeId = isEditMode
        ? existingRouteId!
        : (
            await routesService.create({
              name: name.trim(),
              destinationName: destinationName.trim() || 'Destino final',
              destinationAddress: destinationName.trim(),
              destinationLatitude: destinationCoords.latitude,
              destinationLongitude: destinationCoords.longitude,
            })
          ).id;

      // HU05: las paradas quitadas de una ruta existente se eliminan en el backend; el historial
      // de abordajes no depende de la fila de `stops`, así que se conserva intacto.
      for (const stopId of removedStopIds) {
        await routesService.removeStop(routeId, stopId);
      }

      for (let i = 0; i < sortedStops.length; i++) {
        const stop = sortedStops[i];
        const estimatedTime = estimatedTimes[i];
        if (stop.isNew) {
          await routesService.addStop(routeId, {
            studentId: stop.studentId,
            order: stop.order,
            address: stop.address,
            latitude: stop.latitude,
            longitude: stop.longitude,
            estimatedTime,
          });
        } else if (isEditMode) {
          // Reenvía orden + horario recalculado por si la parada se reordenó o cambió el inicio de ruta.
          await routesService.updateStop(routeId, stop.id, { order: stop.order, estimatedTime });
        }
      }

      // HU05: notifica a los padres de los estudiantes agregados o quitados en esta edición.
      const affectedParentIds = Array.from(affectedParentIdsRef.current);
      if (isEditMode && affectedParentIds.length > 0) {
        await notificationsService.createMany(
          affectedParentIds,
          'Tu ruta fue actualizada',
          `El conductor actualizó la ruta "${name.trim()}". Revisa el panel de paradas para ver los cambios.`,
          'route_updated',
          { routeId },
        ).catch(() => {});
      }

      Alert.alert(
        isEditMode ? 'Ruta actualizada' : 'Ruta creada',
        isEditMode ? 'Los cambios de la ruta fueron guardados.' : 'La ruta y sus paradas han sido guardadas.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Error', 'No se pudo guardar la ruta: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const polylineCoords: Coordinates[] = [
    ...(origin ? [origin] : []),
    ...sortedStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
    ...(destinationCoords ? [destinationCoords] : []),
  ];

  if (loadingRoute) {
    return (
      <View style={styles.container}>
        <Header title="Cargando ruta..." onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={isEditMode ? 'Editar Ruta' : 'Crear Ruta'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Nombre de la ruta escolar"
            placeholder="Ej: Ruta Norte - Colegio Loja"
            value={name}
            onChangeText={(v) => { setName(v); setNameError(''); }}
            error={nameError}
            editable={!isEditMode}
          />

          <Text style={styles.sectionTitle}>Mapa de la ruta</Text>
          <Text style={styles.mapHelp}>
            🔵 Tu ubicación actual · 🟢 Casas de los estudiantes · 🔴 Toca el mapa para marcar el destino final
          </Text>
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={origin ? { ...origin, latitudeDelta: 0.04, longitudeDelta: 0.04 } : DEFAULT_REGION}
              onPress={handleMapPress}
            >
              {origin && <Marker coordinate={origin} title="Tu ubicación" pinColor={colors.secondary} />}
              {sortedStops.map((s) => (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                  title={`${s.order}. ${s.studentName}`}
                  pinColor={colors.success}
                />
              ))}
              {destinationCoords && (
                <Marker coordinate={destinationCoords} title={destinationName || 'Destino'} pinColor={colors.error} />
              )}
              {polylineCoords.length >= 2 && (
                <Polyline coordinates={polylineCoords} strokeColor={colors.primary} strokeWidth={4} />
              )}
            </MapView>
          </View>

          <Input
            label="Nombre del destino final"
            placeholder="Ej: Colegio Sagrado Corazón"
            value={destinationName}
            onChangeText={setDestinationName}
          />
          {!!destinationError && <Text style={styles.errorText}>{destinationError}</Text>}

          <Text style={styles.sectionTitle}>Agregar estudiantes ({stops.length}/{MAX_STOPS} en la ruta)</Text>
          {loadingStudents ? (
            <Text style={styles.loadingText}>Cargando estudiantes...</Text>
          ) : availableStudents.length === 0 ? (
            <Text style={styles.loadingText}>
              {students.length === 0 ? 'No tienes estudiantes registrados.' : 'Todos tus estudiantes ya están en esta ruta.'}
            </Text>
          ) : (
            <View style={styles.selectorRow}>
              {availableStudents.map((st) => (
                <TouchableOpacity key={st.id} style={styles.studentChip} onPress={() => addStop(st)}>
                  <Text style={styles.studentChipText}>+ 👦 {st.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Orden de paradas</Text>
          {sortedStops.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Aún no has agregado estudiantes a esta ruta.</Text>
            </Card>
          ) : (
            sortedStops.map((stop, index) => (
              <Card key={stop.id} style={styles.stopCard}>
                <View style={styles.stopHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>{stop.order}</Text>
                  </View>
                  <View style={styles.stopTextContainer}>
                    <Text style={styles.stopStudent}>👦 {stop.studentName}</Text>
                    <Text style={styles.stopAddress} numberOfLines={2}>{stop.address}</Text>
                    <Text style={styles.stopTime}>🕐 Estimado: {estimatedTimes[index]}</Text>
                  </View>
                </View>
                <View style={styles.stopActions}>
                  <TouchableOpacity
                    onPress={() => moveStop(stop.id, 'up')}
                    disabled={index === 0}
                    style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                  >
                    <Text style={styles.reorderText}>▲</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => moveStop(stop.id, 'down')}
                    disabled={index === sortedStops.length - 1}
                    style={[styles.reorderBtn, index === sortedStops.length - 1 && styles.reorderBtnDisabled]}
                  >
                    <Text style={styles.reorderText}>▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeStop(stop.id)} style={styles.removeBtn}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}

          <Button
            title={isEditMode ? 'Guardar cambios' : 'Guardar Ruta'}
            onPress={handleCreate}
            loading={loading}
            size="lg"
            style={styles.createButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  mapHelp: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  mapWrapper: {
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  map: { flex: 1 },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  selectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  studentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  studentChipText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stopHeader: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  orderText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  stopTextContainer: { flex: 1 },
  stopStudent: { fontSize: 12, fontWeight: '700', color: colors.primary },
  stopAddress: { fontSize: typography.body.fontSize, color: colors.text, marginTop: 2 },
  stopTime: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  stopActions: { flexDirection: 'row', gap: 6, marginLeft: spacing.sm },
  reorderBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderBtnDisabled: { opacity: 0.35 },
  reorderText: { fontSize: 12, color: colors.secondary, fontWeight: '700' },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { fontSize: 14, color: colors.error, fontWeight: '700' },
  emptyCard: { padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  emptyText: { fontSize: typography.body.fontSize, color: colors.textSecondary, textAlign: 'center' },
  createButton: { marginTop: spacing.md },
});

export default CreateRouteScreen;
