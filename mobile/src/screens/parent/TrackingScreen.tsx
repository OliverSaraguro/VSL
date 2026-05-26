import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { Card } from '@/components/common/Card';

let MapView: any;
let Marker: any;
let Polyline: any;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
} catch {
  MapView = null;
  Marker = null;
  Polyline = null;
}

interface TrackingScreenProps {
  navigation: any;
}

const LOJA_REGION = {
  latitude: -3.9931,
  longitude: -79.2042,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const STOPS = [
  { id: '1', name: 'Ciudad Victoria', latitude: -4.0095, longitude: -79.2123, time: '06:30' },
  { id: '2', name: 'Punzara', latitude: -4.0023, longitude: -79.2089, time: '06:38' },
  { id: '3', name: 'Centro - Calle Sucre', latitude: -3.9931, longitude: -79.2042, time: '06:45' },
  { id: '4', name: 'El Valle', latitude: -3.9870, longitude: -79.1987, time: '06:52' },
  { id: '5', name: 'Zamora Huayco', latitude: -3.9812, longitude: -79.1945, time: '06:58' },
  { id: '6', name: 'La Argelia', latitude: -3.9755, longitude: -79.2001, time: '07:05' },
];

const BUS_POSITION = { latitude: -3.9960, longitude: -79.2060 };

const { height } = Dimensions.get('window');

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ navigation }) => {
  const [mapError, setMapError] = useState(false);

  const renderMap = () => {
    if (!MapView || mapError) {
      return (
        <View style={[styles.map, styles.fallbackMap]}>
          <Text style={styles.fallbackEmoji}>🗺️</Text>
          <Text style={styles.fallbackTitle}>Seguimiento en tiempo real</Text>
          <Text style={styles.fallbackText}>Ruta: Ciudad Victoria → La Argelia</Text>
          <View style={styles.stopsContainer}>
            {STOPS.map((stop, i) => (
              <View key={stop.id} style={styles.stopRow}>
                <View style={[styles.stopDot, { backgroundColor: i < 3 ? colors.success : colors.textSecondary }]} />
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopTime}>{stop.time}</Text>
              </View>
            ))}
          </View>
        </View>
      );
    }

    return (
      <MapView style={styles.map} initialRegion={LOJA_REGION} showsUserLocation={false} onError={() => setMapError(true)}>
        <Polyline
          coordinates={STOPS.map(s => ({ latitude: s.latitude, longitude: s.longitude }))}
          strokeColor={colors.primary}
          strokeWidth={4}
        />
        {STOPS.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={stop.name}
            description={`Hora estimada: ${stop.time}`}
            pinColor={index < 3 ? colors.success : colors.secondary}
          />
        ))}
        <Marker coordinate={BUS_POSITION} title="Buseta LOJ-0456" description="Oliver Saraguro">
          <View style={styles.busMarker}>
            <Text style={styles.busEmoji}>🚌</Text>
          </View>
        </Marker>
      </MapView>
    );
  };

  return (
    <View style={styles.container}>
      {renderMap()}

      <View style={styles.infoOverlay}>
        <Card style={styles.infoCard}>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>En vivo</Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Próxima parada</Text>
              <Text style={styles.infoValue}>Av. Universitaria - Punzara</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ETA</Text>
              <Text style={styles.infoValueBig}>~5 min</Text>
            </View>
          </View>
          <View style={styles.driverRow}>
            <Text style={styles.driverText}>🚌 Oliver Saraguro · LOJ-0456</Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1, height: height * 0.6 },
  fallbackMap: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F5E9', padding: spacing.xl },
  fallbackEmoji: { fontSize: 48, marginBottom: spacing.md },
  fallbackTitle: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  fallbackText: { fontSize: typography.body.fontSize, color: colors.textSecondary, marginBottom: spacing.lg },
  stopsContainer: { width: '100%', paddingHorizontal: spacing.lg },
  stopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  stopDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  stopName: { flex: 1, fontSize: typography.body.fontSize, color: colors.text },
  stopTime: { fontSize: typography.small.fontSize, color: colors.textSecondary },
  busMarker: { backgroundColor: '#FFF', borderRadius: 20, padding: 4, borderWidth: 2, borderColor: colors.primary },
  busEmoji: { fontSize: 20 },
  infoOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md },
  infoCard: { borderRadius: 20 },
  liveRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.error, marginRight: 6 },
  liveText: { fontSize: typography.small.fontSize, fontWeight: '700', color: colors.error },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  infoItem: {},
  infoLabel: { fontSize: typography.small.fontSize, color: colors.textSecondary },
  infoValue: { fontSize: typography.body.fontSize, fontWeight: '600', color: colors.text, marginTop: 2 },
  infoValueBig: { fontSize: typography.h3.fontSize, fontWeight: '800', color: colors.primary, marginTop: 2 },
  driverRow: { borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: spacing.sm },
  driverText: { fontSize: typography.body.fontSize, color: colors.textSecondary },
});
