import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/config/theme';

function SkeletonRect({
  width,
  height,
  style,
  delay = 0,
}: {
  width: number | string;
  height: number;
  style?: object;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, delay, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: 10, backgroundColor: colors.border, opacity: anim }, style]}
    />
  );
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <View style={styles.card}>
      <SkeletonRect width={46} height={46} style={{ borderRadius: 23, marginRight: spacing.md }} delay={delay} />
      <View style={{ flex: 1 }}>
        <SkeletonRect width="65%" height={13} style={{ marginBottom: 8 }} delay={delay + 60} />
        <SkeletonRect width="40%" height={10} delay={delay + 120} />
      </View>
    </View>
  );
}

interface LoadingScreenProps {
  message?: string;
  variant?: 'cards' | 'full';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ variant = 'cards' }) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top + spacing.lg, opacity: fadeAnim }]}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonRect width={36} height={36} style={{ borderRadius: 18 }} delay={0} />
        <SkeletonRect width={120} height={16} style={{ marginHorizontal: 'auto' }} delay={80} />
        <SkeletonRect width={36} height={36} style={{ borderRadius: 18 }} delay={0} />
      </View>

      {/* Search skeleton */}
      <View style={[styles.searchSkeleton, { width: width - spacing.lg * 2 }]}>
        <SkeletonRect width="100%" height={42} style={{ borderRadius: 12 }} delay={100} />
      </View>

      {/* Cards */}
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} delay={i * 80} />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  searchSkeleton: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
