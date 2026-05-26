import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';

type RouteStatus = 'ACTIVA' | 'EN_PAUSA' | 'FINALIZADA';

interface StatusBadgeProps {
  status: RouteStatus;
}

const statusConfig: Record<RouteStatus, { label: string; bg: string; text: string }> = {
  ACTIVA: { label: 'Activa', bg: '#E8F5E9', text: colors.success },
  EN_PAUSA: { label: 'En pausa', bg: '#FFF8E1', text: '#F57F17' },
  FINALIZADA: { label: 'Finalizada', bg: '#EEEEEE', text: '#757575' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <View
      style={[styles.badge, { backgroundColor: config.bg }]}
      accessibilityLabel={`Estado: ${config.label}`}
    >
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
});
