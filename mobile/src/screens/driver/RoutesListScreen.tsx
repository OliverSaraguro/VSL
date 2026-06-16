import React, { useCallback, useState } from 'react';
<<<<<<< Updated upstream
import { View, Text, FlatList, RefreshControl, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
=======
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
>>>>>>> Stashed changes
import { colors, typography, spacing } from '@/config/theme';
import { Button } from '@/components/common/Button';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { EmptyState } from '@/components/common/EmptyState';
import { RouteCard } from '@/components/routes/RouteCard';
import { useRoutesStore } from '@/store/routes.store';
import type { Route } from '@/types';

interface RoutesListScreenProps {
  navigation: any;
}

// "Inicio" muestra solo la ruta de HOY como acceso rápido para arrancar el día; esta pantalla
// (tab "Rutas") es el listado completo: aquí el conductor administra todas sus rutas (crea
// nuevas, revisa el detalle de cada una, incluso las que no corren hoy).
export const RoutesListScreen: React.FC<RoutesListScreenProps> = ({ navigation }) => {
<<<<<<< Updated upstream
  const insets = useSafeAreaInsets();
=======
>>>>>>> Stashed changes
  const { routes, isLoading, fetchRoutes } = useRoutesStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    await fetchRoutes();
    setLoadedOnce(true);
  }, [fetchRoutes]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (isLoading && !loadedOnce) return <LoadingScreen />;

  return (
    <View style={styles.container}>
<<<<<<< Updated upstream
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 4 : 0) + spacing.sm }]}>
=======
      <View style={styles.header}>
>>>>>>> Stashed changes
        <Text style={styles.title}>Mis rutas</Text>
        <Button title="➕ Nueva ruta" onPress={() => navigation.navigate('CreateRoute')} size="sm" />
      </View>

      <FlatList<Route>
        data={routes}
        keyExtractor={(item) => item.id}
<<<<<<< Updated upstream
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
=======
        contentContainerStyle={styles.list}
>>>>>>> Stashed changes
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="🛣️"
            title="Todavía no tienes rutas"
            message="Crea tu primera ruta para empezar a gestionar paradas y estudiantes."
            actionLabel="Crear ruta"
            onAction={() => navigation.navigate('CreateRoute')}
          />
        }
        renderItem={({ item }) => (
          <RouteCard route={item} onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
<<<<<<< Updated upstream
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.h2.fontSize, fontWeight: '800', color: colors.text },
  list: { paddingHorizontal: spacing.lg },
=======
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.h2.fontSize, fontWeight: '800', color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 32 },
>>>>>>> Stashed changes
});
