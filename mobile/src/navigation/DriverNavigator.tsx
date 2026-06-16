import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors, typography } from '../config/theme';
import { buildCustomTabBar } from '../components/common/CustomTabBar';

import { DashboardScreen } from '../screens/driver/DashboardScreen';
import { RoutesListScreen } from '../screens/driver/RoutesListScreen';
import { StudentsScreen } from '../screens/driver/StudentsScreen';
import { RegisterStudentScreen } from '../screens/driver/RegisterStudentScreen';
import { PaymentsScreen } from '../screens/driver/PaymentsScreen';
import { ProfileScreen } from '../screens/driver/ProfileScreen';
import { CreateRouteScreen } from '../screens/driver/CreateRouteScreen';
import { ActiveRouteScreen } from '../screens/driver/ActiveRouteScreen';
import { RouteDetailScreen } from '../screens/driver/RouteDetailScreen';
import { MessageHistoryScreen } from '../screens/driver/MessageHistoryScreen';

export type DriverTabParamList = {
  DriverRoutes: undefined;
  DriverStudents: undefined;
  DriverDashboard: undefined;
  DriverPayments: undefined;
  DriverProfile: undefined;
};

const Tab = createBottomTabNavigator<DriverTabParamList>();
const RoutesStack = createStackNavigator();
const StudentsStack = createStackNavigator();

const DRIVER_TAB_CONFIG = {
  DriverRoutes:    { icon: 'map'      as const, label: 'Rutas' },
  DriverStudents:  { icon: 'people'   as const, label: 'Estudiantes' },
  DriverDashboard: { icon: 'home'     as const, label: 'Inicio' },
  DriverPayments:  { icon: 'payments' as const, label: 'Pagos' },
  DriverProfile:   { icon: 'person'   as const, label: 'Perfil' },
};

const driverTabBar = buildCustomTabBar(DRIVER_TAB_CONFIG);

function RoutesStackNavigator() {
  return (
    <RoutesStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: typography.fontWeight.bold },
      }}
    >
<<<<<<< Updated upstream
      <RoutesStack.Screen
        name="RoutesList"
        component={RoutesListScreen}
        options={{ headerShown: false }}
      />
      <RoutesStack.Screen
        name="CreateRoute"
        component={CreateRouteScreen as any}
        options={{ headerShown: false }}
      />
      <RoutesStack.Screen
        name="ActiveRoute"
        component={ActiveRouteScreen}
        options={{ headerShown: false }}
      />
      <RoutesStack.Screen
        name="RouteDetail"
        component={RouteDetailScreen as any}
        options={{ headerShown: false }}
      />
      <RoutesStack.Screen
        name="MessageHistory"
        component={MessageHistoryScreen as any}
        options={{ headerShown: false }}
      />
    </RoutesStack.Navigator>
=======
      <Stack.Screen name="RoutesList" component={RoutesListScreen} options={{ title: 'Mis Rutas' }} />
      <Stack.Screen name="CreateRoute" component={CreateRouteScreen as any} options={{ title: 'Nueva Ruta' }} />
      <Stack.Screen name="ActiveRoute" component={ActiveRouteScreen} options={{ title: 'Ruta Activa', headerShown: false }} />
      <Stack.Screen name="RouteDetail" component={RouteDetailScreen as any} options={{ title: 'Detalle de Ruta' }} />
    </Stack.Navigator>
>>>>>>> Stashed changes
  );
}

function StudentsStackNavigator() {
  return (
    <StudentsStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentsStack.Screen name="StudentsList" component={StudentsScreen} />
      <StudentsStack.Screen name="RegisterStudent" component={RegisterStudentScreen} />
    </StudentsStack.Navigator>
  );
}

export default function DriverNavigator() {
  return (
    <Tab.Navigator
      tabBar={driverTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="DriverRoutes"    component={RoutesStackNavigator} />
      <Tab.Screen name="DriverStudents"  component={StudentsStackNavigator} />
      <Tab.Screen name="DriverDashboard" component={DashboardScreen} />
      <Tab.Screen name="DriverPayments"  component={PaymentsScreen} />
      <Tab.Screen name="DriverProfile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}
