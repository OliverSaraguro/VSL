import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/config/theme';
import type { Student } from '@/types';

interface StudentCardProps {
  student: Student;
  boarded?: boolean;
  absent?: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({ student, boarded = false, absent = false }) => (
  <View
    style={[styles.card, boarded && styles.cardBoarded, absent && styles.cardAbsent]}
    accessibilityLabel={`${student.name}, ${absent ? 'ausente' : boarded ? 'abordó' : 'pendiente'}`}
  >
    <View style={styles.avatarContainer}>
      {student.photoUrl ? (
        <Image source={{ uri: student.photoUrl }} style={[styles.avatar, absent && styles.avatarAbsent]} />
      ) : (
        <View style={[styles.avatarPlaceholder, absent && styles.avatarAbsent]}>
          <Text style={styles.avatarInitial}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {boarded && !absent && (
        <View style={styles.checkBadge}>
          <MaterialIcons name="check" size={10} color="#FFFFFF" />
        </View>
      )}
    </View>

    <View style={styles.info}>
      <Text style={[styles.name, absent && styles.textAbsent]} numberOfLines={1}>{student.name}</Text>
      <Text style={[styles.detail, absent && styles.textAbsent]} numberOfLines={1}>{student.address}</Text>
    </View>

    <View style={[styles.status, absent ? styles.statusAbsent : boarded ? styles.statusBoarded : styles.statusPending]}>
      <Text
        style={[
          styles.statusText,
          absent ? styles.statusTextAbsent : boarded ? styles.statusTextBoarded : styles.statusTextPending,
        ]}
      >
        {absent ? 'Ausente' : boarded ? 'Abordó' : 'Pendiente'}
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBoarded: {
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  cardAbsent: {
    opacity: 0.55,
  },
  avatarAbsent: {
    opacity: 0.6,
  },
  textAbsent: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  statusAbsent: {
    backgroundColor: '#EEEEEE',
  },
  statusTextAbsent: {
    color: colors.textSecondary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.2,
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
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: typography.small.fontSize,
    fontWeight: '600',
  },
  statusTextBoarded: {
    color: '#16A34A',
  },
  statusTextPending: {
    color: '#B45309',
  },
});
