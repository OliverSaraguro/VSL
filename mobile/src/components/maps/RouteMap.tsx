import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { colors, spacing } from '@/config/theme';
import type { Stop, Coordinates } from '@/types';
type RouteStop = Stop & { absent?: boolean; studentName?: string };
type Coordinate = Coordinates;

interface RouteMapProps {
  stops: RouteStop[];
  routePath: Coordinate[];
  busPosition?: Coordinate | null;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

const DEFAULT_REGION = {
  latitude: -3.99,
  longitude: -79.2,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const RouteMap: React.FC<RouteMapProps> = ({
  stops,
  routePath,
  busPosition,
  initialRegion = DEFAULT_REGION,
}) => (
  <View style={styles.container}>
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {routePath.length > 0 && (
        <Polyline
          coordinates={routePath}
          strokeColor={colors.primary}
          strokeWidth={4}
        />
      )}

      {stops.map((stop, index) => (
        <Marker
          key={stop.id}
          coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
          title={`${index + 1}. ${stop.studentName}`}
          description={stop.estimatedTime}
          pinColor={stop.absent ? '#9E9E9E' : colors.primary}
        />
      ))}

      {busPosition && (
        <Marker
          coordinate={busPosition}
          title="Buseta"
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.busMarker}>
            <View style={styles.busIcon} />
          </View>
        </Marker>
      )}
    </MapView>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  busMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  busIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
});
