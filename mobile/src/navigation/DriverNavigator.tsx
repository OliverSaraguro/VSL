import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import { colors, typography } from '../config/theme';

import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { StudentsScreen } from '../screens/driver/StudentsScreen';
import { PaymentsScreen } from '../screens/driver/PaymentsScreen';
import { ProfileScreen } from '../screens/driver/ProfileScreen';
import { CreateRouteScreen } from '../screens/driver/CreateRouteScreen';
import { ActiveRouteScreen } from '../screens/driver/ActiveRouteScreen';

export type DriverTabParamList = {
  DriverDashboard: undefined;
  DriverRoutes: undefined;
  DriverStudents: undefined;
  DriverPayments: undefined;
  DriverProfile: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();
const Stack = createStackNavigator();

function RoutesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: typography.fontWeight.bold },
      }}
    >
      <Stack.Screen name="RoutesList" component={DashboardScreen} options={{ title: 'Mis Rutas' }} />
      <Stack.Screen name="CreateRoute" component={CreateRouteScreen} options={{ title: 'Nueva Ruta' }} />
      <Stack.Screen name="ActiveRoute" component={ActiveRouteScreen} options={{ title: 'Ruta Activa', headerShown: false }} />
    </Stack.Navigator>
  );
}

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Inicio: '🏠',
    Rutas: '🗺️',
    Estudiantes: '👦',
    Pagos: '💰',
    Perfil: '👤',
  };
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[label] || '📌'}</Text>;
}

export default function DriverNavigator() {
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
            DriverDashboard: 'Inicio',
            DriverRoutes: 'Rutas',
            DriverStudents: 'Estudiantes',
            DriverPayments: 'Pagos',
            DriverProfile: 'Perfil',
          };
          return <TabIcon label={labels[route.name] || ''} focused={focused} />;
        },
      })}
    >
      <Tab.Screen
        name="DriverDashboard"
        component={DashboardScreen}
        options={{ title: 'Inicio', tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="DriverRoutes"
        component={RoutesStack}
        options={{ title: 'Rutas', tabBarLabel: 'Rutas', headerShown: false }}
      />
      <Tab.Screen
        name="DriverStudents"
        component={StudentsScreen}
        options={{ title: 'Estudiantes', tabBarLabel: 'Estudiantes' }}
      />
      <Tab.Screen
        name="DriverPayments"
        component={PaymentsScreen}
        options={{ title: 'Pagos', tabBarLabel: 'Pagos' }}
      />
      <Tab.Screen
        name="DriverProfile"
        component={ProfileScreen}
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}
