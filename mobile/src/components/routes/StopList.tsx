import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/config/theme';
import type { RouteStop } from '@/types';

interface StopListProps {
  stops: RouteStop[];
}

const StopItem: React.FC<{ stop: RouteStop; index: number }> = ({ stop, index }) => (
  <View style={styles.item}>
    <View style={[styles.orderBadge, stop.absent && styles.orderBadgeAbsent]}>
      <Text style={styles.orderText}>{index + 1}</Text>
    </View>

    <View style={styles.connector}>
      <View style={[styles.line, stop.absent && styles.lineAbsent]} />
    </View>

    <View style={[styles.content, stop.absent && styles.contentAbsent]}>
      <Text style={[styles.name, stop.absent && styles.nameAbsent]} numberOfLines={1}>
        {stop.studentName}
      </Text>
      <Text style={styles.time}>{stop.estimatedTime}</Text>
      {stop.absent && <Text style={styles.absentLabel}>Ausente</Text>}
    </View>
  </View>
);

export const StopList: React.FC<StopListProps> = ({ stops }) => (
  <FlatList
    data={stops}
    keyExtractor={(item) => item.id}
    renderItem={({ item, index }) => <StopItem stop={item} index={index} />}
    contentContainerStyle={styles.list}
    showsVerticalScrollIndicator={false}
  />
);

const styles = StyleSheet.create({
  list: {
    paddingVertical: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  orderBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  orderBadgeAbsent: {
    backgroundColor: '#BDBDBD',
  },
  orderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  connector: {
    width: 20,
    alignItems: 'center',
  },
  line: {
    width: 2,
    height: 28,
    backgroundColor: colors.primary,
  },
  lineAbsent: {
    backgroundColor: '#E0E0E0',
  },
  content: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginLeft: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  contentAbsent: {
    opacity: 0.6,
    borderLeftColor: '#BDBDBD',
  },
  name: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.text,
  },
  nameAbsent: {
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: typography.small.fontSize,
    color: colors.textSecondary,
    marginTop: 2,
  },
  absentLabel: {
    fontSize: typography.small.fontSize,
    color: colors.error,
    fontWeight: '500',
    marginTop: 2,
  },
});
