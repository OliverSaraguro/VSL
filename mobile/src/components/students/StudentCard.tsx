import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import type { Student } from '@/types';

interface StudentCardProps {
  student: Student;
  boarded?: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, boarded = false }) => (
  <View
    style={[styles.card, boarded && styles.cardBoarded]}
    accessibilityLabel={`${student.name}, ${boarded ? 'abordó' : 'pendiente'}`}
  >
    <View style={styles.avatarContainer}>
      {student.photoUrl ? (
        <Image source={{ uri: student.photoUrl }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {boarded && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      )}
    </View>

    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
      <Text style={styles.detail} numberOfLines={1}>{student.address}</Text>
    </View>

    <View style={[styles.status, boarded ? styles.statusBoarded : styles.statusPending]}>
      <Text style={[styles.statusText, boarded ? styles.statusTextBoarded : styles.statusTextPending]}>
        {boarded ? 'Abordó' : 'Pendiente'}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBoarded: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  detail: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  status: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBoarded: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
  statusTextBoarded: {
    color: colors.success,
  },
  statusTextPending: {
    color: '#F57F17',
  },
});
