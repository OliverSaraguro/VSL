import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/config/theme';

interface BoardingButtonProps {
  studentName: string;
  boarded: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const BoardingButton: React.FC<BoardingButtonProps> = ({
  studentName,
  boarded,
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.button, boarded ? styles.boarded : styles.pending, disabled && styles.disabled]}
    onPress={onPress}
    disabled={disabled || boarded}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityLabel={`Registrar abordaje de ${studentName}`}
    accessibilityState={{ disabled: disabled || boarded }}
  >
    <Text style={styles.icon}>{boarded ? '✓' : '🚌'}</Text>
    <Text style={[styles.label, boarded && styles.labelBoarded]}>
      {boarded ? 'Abordó' : 'Abordar'}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pending: {
    backgroundColor: colors.primary,
  },
  boarded: {
    backgroundColor: '#E8F5E9',
  },
  disabled: {
    opacity: 0.4,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  labelBoarded: {
    color: colors.success,
  },
});
