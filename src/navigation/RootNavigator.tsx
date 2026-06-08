import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { colors } from '@/theme';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { Platform } from 'react-native';

const linking = Platform.OS === 'web' ? {
  prefixes: [],
  config: {
    screens: {
      HomeTab: '/',
      CulturaTab: '/cultura',
      ViajesTab: '/viajes',
      LumiTab: '/lumi',
      FotosTab: '/fotos',
      PerfilTab: '/perfil',
    },
  },
} : undefined;

const ONBOARDING_KEY = 'lunaria_onboarding_done';

export default function RootNavigator() {
  useAuth();

  const { session, isInitialized } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  // Marcar onboarding como completado cuando el usuario llega al login/register
  // Lo hacemos en AuthStack via el initialRouteName

  if (!isInitialized || onboardingDone === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking as any}>
      {session
        ? <MainTabs />
        : <AuthStack initialRoute={onboardingDone ? 'Login' : 'Onboarding'} onOnboardingDone={() => {
            AsyncStorage.setItem(ONBOARDING_KEY, 'true');
            setOnboardingDone(true);
          }} />
      }
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
});
