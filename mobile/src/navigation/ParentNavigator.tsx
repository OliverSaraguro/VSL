import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { colors, typography } from '../config/theme';

import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { TrackingScreen } from '../screens/parent/TrackingScreen';
import { HistoryScreen } from '../screens/parent/HistoryScreen';
import { ProfileScreen } from '../screens/parent/ProfileScreen';

export type ParentTabParamList = {
  ParentDashboard: undefined;
  ParentTracking: undefined;
  ParentHistory: undefined;
  ParentProfile: undefined;
};

const Tab = createBottomTabNavigator<ParentTabParamList>();

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Inicio: '🏠',
    Rastreo: '📍',
    Historial: '📋',
    Perfil: '👤',
  };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '📌'}</Text>;
}

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: typography.fontWeight.bold },
        tabBarIcon: ({ focused }) => {
          const labels: Record<string, string> = {
            ParentDashboard: 'Inicio',
            ParentTracking: 'Rastreo',
            ParentHistory: 'Historial',
            ParentProfile: 'Perfil',
          };
          return <TabIcon label={labels[route.name] || ''} focused={focused} />;
        },
      })}
    >
      <Tab.Screen
        name="ParentDashboard"
        component={DashboardScreen}
        options={{ title: 'Inicio', tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="ParentTracking"
        component={TrackingScreen}
        options={{ title: 'Rastreo', tabBarLabel: 'Rastreo' }}
      />
      <Tab.Screen
        name="ParentHistory"
        component={HistoryScreen}
        options={{ title: 'Historial', tabBarLabel: 'Historial' }}
      />
      <Tab.Screen
        name="ParentProfile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
