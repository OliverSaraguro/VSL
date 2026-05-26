import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterDriverScreen } from '../screens/auth/RegisterDriverScreen';
import { RegisterParentScreen } from '../screens/auth/RegisterParentScreen';
import { colors, typography } from '../config/theme';

export type AuthStackParamList = {
  Login: undefined;
  RegisterDriver: undefined;
  RegisterParent: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: typography.fontWeight.bold },
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RegisterDriver"
        component={RegisterDriverScreen}
        options={{ title: 'Registro Conductor' }}
      />
      <Stack.Screen
        name="RegisterParent"
        component={RegisterParentScreen}
        options={{ title: 'Registro Padre' }}
      />
    </Stack.Navigator>
  );
}
