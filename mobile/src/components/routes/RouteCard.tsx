import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { Route } from '@/types';

interface RouteCardProps {
  route: Route;
  onPress?: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, onPress }) => {
  const stopsCount = route.stops?.length ?? 0;
  const firstStop = route.stops?.[0]?.estimatedTime ?? '--:--';
  const lastStop = route.stops?.[stopsCount - 1]?.estimatedTime ?? '--:--';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Ruta ${route.name}`}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{route.name}</Text>
        {route.isActive && <StatusBadge status="ACTIVA" />}
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoText}>{stopsCount} paradas</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoText}>{firstStop} - {lastStop}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    color: colors.text,
    marginRight: spacing.sm,
  },
  info: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  infoText: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
  },
});
