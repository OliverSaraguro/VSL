import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, typography, spacing } from '@/config/theme';
import { Header } from '@/components/common/Header';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { StatusBadge } from '@/components/common/StatusBadge';
import { StudentCard } from '@/components/students/StudentCard';
import routesService from '@/servicios/routes.service';
import substitutionsService, { Substitution } from '@/servicios/substitutions.service';
import notificationsService from '@/servicios/notifications.service';
import { useAuthStore } from '@/store/auth.store';
import type { Route, Student } from '@/types';

interface RouteDetailScreenProps {
  navigation: any;
  route: { params: { routeId: string } };
}

export const RouteDetailScreen: React.FC<RouteDetailScreenProps> = ({
  navigation,
  route: navRoute,
}) => {
  const { routeId } = navRoute.params;
  const { user } = useAuthStore();
  const [routeData, setRouteData] = useState<Route | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [subEmail, setSubEmail] = useState('');
  const [subDate, setSubDate] = useState('');
  const [authorizing, setAuthorizing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, subs] = await Promise.all([
        routesService.getById(routeId),
        substitutionsService.getUpcomingForRoute(routeId).catch(() => []),
      ]);
      setRouteData(data);
      const routeStudents = (data as any).stops
        ?.map((stop: any) => stop.student)
        .filter(Boolean) ?? [];
      setStudents(routeStudents);
      setSubstitutions(subs);
    } catch (err: any) {
      console.error('[RouteDetailScreen] load', err);
      Alert.alert('Error', err?.message || 'No se pudo cargar el detalle de la ruta.');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  // HU25: autoriza a otro conductor verificado para cubrir esta ruta en una fecha específica.
  // HU26: avisa a los padres con el nombre del sustituto en cuanto queda asignado.
  const handleAuthorizeSubstitute = async () => {
    if (!subEmail.trim() || !subDate.trim() || !user) {
      Alert.alert('Datos incompletos', 'Ingresa el correo del conductor y la fecha (AAAA-MM-DD).');
      return;
    }
    setAuthorizing(true);
    try {
      const substitute = await substitutionsService.findVerifiedDriverByEmail(subEmail.trim());
      if (!substitute) {
        Alert.alert(
          'No encontrado',
          'No existe un conductor verificado con ese correo. Solo conductores con cuenta activa y verificada pueden ser sustitutos.',
        );
        return;
      }

      await substitutionsService.authorize(routeId, user.id, substitute.id, subDate.trim());

      const parentIds = Array.from(new Set(students.map((s) => s.parentId).filter(Boolean) as string[]));
      await notificationsService.createMany(
        parentIds,
        'Conductor sustituto asignado',
        `${substitute.name} cubrirá la ruta el ${subDate.trim()}.`,
        'route_updated',
        { routeId, date: subDate.trim() },
      );

      setSubEmail('');
      setSubDate('');
      Alert.alert('Autorizado', `${substitute.name} fue autorizado para el ${subDate.trim()}.`);
      load();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo autorizar al conductor sustituto.');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleRevokeSubstitute = (sub: Substitution) => {
    Alert.alert('Revocar autorización', `¿Quitar a ${sub.substituteName} del ${sub.date}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revocar',
        style: 'destructive',
        onPress: async () => {
          try {
            await substitutionsService.revoke(sub.id);
            load();
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'No se pudo revocar.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  if (loading) return <LoadingScreen />;

  if (!routeData) {
    return (
      <View style={styles.container}>
        <Header title="Detalle de Ruta" onBack={() => navigation.goBack()} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró la ruta</Text>
        </View>
      </View>
    );
  }

  const stops = (routeData as any).stops ?? [];
  const firstTime = stops[0]?.estimatedTime ?? '--:--';
  const lastTime = stops[stops.length - 1]?.estimatedTime ?? '--:--';

  const hasDestination = !!(routeData.destinationLatitude && routeData.destinationLongitude);
  const mapCoords = [
    ...stops.map((s: any) => ({ latitude: s.latitude, longitude: s.longitude })),
    ...(hasDestination
      ? [{ latitude: routeData.destinationLatitude!, longitude: routeData.destinationLongitude! }]
      : []),
  ];

  return (
    <View style={styles.container}>
      <Header title={routeData.name} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Info general */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estado</Text>
            <StatusBadge status={routeData.isActive ? 'ACTIVA' : 'FINALIZADA'} />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Paradas</Text>
            <Text style={styles.infoValue}>{stops.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Horario</Text>
            <Text style={styles.infoValue}>{firstTime} - {lastTime}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoLabel}>Estudiantes</Text>
            <Text style={styles.infoValue}>{students.length}</Text>
          </View>
        </Card>

        {/* Mapa con la ruta trazada */}
        {mapCoords.length > 0 && (
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: mapCoords[0].latitude,
                longitude: mapCoords[0].longitude,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
            >
              {stops.map((s: any, i: number) => (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                  title={`${i + 1}. ${s.student?.name ?? 'Parada'}`}
                  pinColor={colors.success}
                />
              ))}
              {hasDestination && (
                <Marker
                  coordinate={{ latitude: routeData.destinationLatitude!, longitude: routeData.destinationLongitude! }}
                  title={routeData.destinationName || 'Destino'}
                  pinColor={colors.error}
                />
              )}
              {mapCoords.length >= 2 && (
                <Polyline coordinates={mapCoords} strokeColor={colors.primary} strokeWidth={4} />
              )}
            </MapView>
          </View>
        )}

        {/* Paradas */}
        <Text style={styles.sectionTitle}>Paradas</Text>
        {stops.map((stop: any, index: number) => (
          <Card key={stop.id || index} style={styles.stopCard}>
            <View style={styles.stopOrder}>
              <Text style={styles.stopOrderText}>{index + 1}</Text>
            </View>
            <View style={styles.stopInfo}>
              <Text style={styles.stopAddress}>{stop.address}</Text>
              <Text style={styles.stopTime}>{stop.estimatedTime} · {stop.student?.name ?? 'Sin asignar'}</Text>
            </View>
          </Card>
        ))}

        {/* Estudiantes */}
        <Text style={styles.sectionTitle}>Estudiantes ({students.length})</Text>
        {students.map((s) => (
          <StudentCard key={s.id} student={s} />
        ))}

        {/* Conductor sustituto */}
        <Text style={styles.sectionTitle}>Conductor sustituto</Text>
        <Card>
          <Text style={styles.subHelp}>
            Autoriza a otro conductor verificado de VSL para cubrir esta ruta en una fecha
            específica. Se le notificará a los padres con su nombre.
          </Text>
          <Input
            label="Correo del conductor sustituto"
            placeholder="conductor@ejemplo.com"
            value={subEmail}
            onChangeText={setSubEmail}
            keyboardType="email-address"
          />
          <Input
            label="Fecha (AAAA-MM-DD)"
            placeholder="2026-06-20"
            value={subDate}
            onChangeText={setSubDate}
          />
          <Button
            title="Autorizar sustituto"
            onPress={handleAuthorizeSubstitute}
            loading={authorizing}
            size="md"
            style={styles.subButton}
          />

          {substitutions.length > 0 && (
            <View style={styles.subList}>
              {substitutions.map((sub) => (
                <View key={sub.id} style={styles.subRow}>
                  <Text style={styles.subRowText}>
                    {sub.date} · {sub.substituteName}
                  </Text>
                  <Button title="Revocar" onPress={() => handleRevokeSubstitute(sub)} variant="outline" size="sm" />
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Acciones */}
        <View style={styles.actions}>
          <Button
            title="➕  Agregar estudiantes"
            onPress={() => navigation.navigate('CreateRoute', { routeId })}
            variant="outline"
            size="lg"
          />
          <Button
            title="🚌  Iniciar Ruta"
            onPress={() => navigation.navigate('ActiveRoute', { routeId })}
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  infoCard: { marginBottom: spacing.lg },
  mapWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  map: { flex: 1 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: { fontSize: typography.body.fontSize, color: colors.textSecondary },
  infoValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  sectionTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  stopCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm },
  stopOrder: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  stopOrderText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  stopInfo: { flex: 1 },
  stopAddress: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text },
  stopTime: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginTop: 2 },
  actions: { marginTop: spacing.xl, gap: spacing.md },
  subHelp: { fontSize: typography.small.fontSize, color: colors.textSecondary, marginBottom: spacing.sm },
  subButton: { marginTop: spacing.sm },
  subList: { marginTop: spacing.md, gap: spacing.sm },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  subRowText: { fontSize: typography.body.fontSize, color: colors.text, flex: 1, marginRight: spacing.sm },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: typography.body.fontSize, color: colors.textSecondary },
});
