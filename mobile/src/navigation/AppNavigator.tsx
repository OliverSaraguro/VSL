import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../config/theme';
import AuthNavigator from './AuthNavigator';
import DriverNavigator from './DriverNavigator';
import ParentNavigator from './ParentNavigator';

export default function AppNavigator() {
  const { isAuthenticated, isHydrated, isDriver, isParent } = useAuth();

  if (!isHydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (isDriver) {
    return <DriverNavigator />;
  }

  if (isParent) {
    return <ParentNavigator />;
  }

  return <AuthNavigator />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
