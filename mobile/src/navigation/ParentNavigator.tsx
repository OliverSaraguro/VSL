import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../config/theme';
import { buildCustomTabBar } from '../components/common/CustomTabBar';

import { DashboardScreen } from '../screens/parent/DashboardScreen';
import { TrackingScreen } from '../screens/parent/TrackingScreen';
import { HistoryScreen } from '../screens/parent/HistoryScreen';
import { ProfileScreen } from '../screens/parent/ProfileScreen';
import { AbsenceScreen } from '../screens/parent/AbsenceScreen';

export type ParentTabParamList = {
  ParentTracking:  undefined;
  ParentAbsence:   undefined;
  ParentDashboard: undefined;
  ParentHistory:   undefined;
  ParentProfile:   undefined;
};

const Tab = createBottomTabNavigator<ParentTabParamList>();

const PARENT_TAB_CONFIG = {
  ParentTracking:  { icon: 'location-on' as const, label: 'Rastreo' },
  ParentAbsence:   { icon: 'event-busy'  as const, label: 'Ausencia' },
  ParentDashboard: { icon: 'home'        as const, label: 'Inicio' },
  ParentHistory:   { icon: 'history'     as const, label: 'Historial' },
  ParentProfile:   { icon: 'person'      as const, label: 'Perfil' },
};

const parentTabBar = buildCustomTabBar(PARENT_TAB_CONFIG);

export default function ParentNavigator() {
  return (
    <Tab.Navigator
      tabBar={parentTabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="ParentTracking"  component={TrackingScreen} />
      <Tab.Screen name="ParentAbsence"   component={AbsenceScreen} />
      <Tab.Screen name="ParentDashboard" component={DashboardScreen} />
      <Tab.Screen name="ParentHistory"   component={HistoryScreen} />
      <Tab.Screen name="ParentProfile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
}
