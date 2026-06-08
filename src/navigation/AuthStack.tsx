import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/types/navigation';
import { colors } from '@/theme';

import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

interface Props {
  initialRoute: keyof AuthStackParamList;
  onOnboardingDone: () => void;
}

export default function AuthStack({ initialRoute, onOnboardingDone }: Props) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'fade',
      }}
      screenListeners={{
        state: (e) => {
          // Mark onboarding done as soon as user reaches Login or Register
          const routes = e.data?.state?.routes ?? [];
          const names = routes.map((r: { name: string }) => r.name);
          if (names.includes('Login') || names.includes('Register')) {
            onOnboardingDone();
          }
        },
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
