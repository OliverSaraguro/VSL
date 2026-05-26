import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../types';

interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  trackingInterval?: number;
  distanceFilter?: number;
}

interface UseLocationReturn {
  location: Coordinates | null;
  heading: number | null;
  speed: number | null;
  error: string | null;
  isTracking: boolean;
  requestPermission: () => Promise<boolean>;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<Coordinates | null>;
}

export function useLocation(options: UseLocationOptions = {}): UseLocationReturn {
  const {
    enableHighAccuracy = true,
    trackingInterval = 5000,
    distanceFilter = 10,
  } = options;

  const [location, setLocation] = useState<Coordinates | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permiso de ubicación denegado');
        return false;
      }
      return true;
    } catch {
      setError('Error al solicitar permisos de ubicación');
      return false;
    }
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<Coordinates | null> => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) return null;

      const current = await Location.getCurrentPositionAsync({
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const coords: Coordinates = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setLocation(coords);
      setSpeed(current.coords.speed);
      setHeading(current.coords.heading);
      setError(null);

      return coords;
    } catch {
      setError('Error al obtener ubicación');
      return null;
    }
  }, [enableHighAccuracy, requestPermission]);

  const startTracking = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
    }

    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
        timeInterval: trackingInterval,
        distanceInterval: distanceFilter,
      },
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setSpeed(position.coords.speed);
        setHeading(position.coords.heading);
        setError(null);
      },
    );

    setIsTracking(true);
  }, [enableHighAccuracy, trackingInterval, distanceFilter, requestPermission]);

  const stopTracking = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
    };
  }, []);

  return {
    location,
    heading,
    speed,
    error,
    isTracking,
    requestPermission,
    startTracking,
    stopTracking,
    getCurrentLocation,
  };
}
