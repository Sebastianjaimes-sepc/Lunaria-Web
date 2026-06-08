import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  MainTabParamList,
  HomeStackParamList,
  CulturaStackParamList,
  ViajesStackParamList,
  FotosStackParamList,
  PerfilStackParamList,
} from '@/types/navigation';
import { colors, spacing, borderRadius } from '@/theme';

// Screens
import HomeScreen from '@/screens/home/HomeScreen';
import CulturaListScreen from '@/screens/cultura/CulturaListScreen';
import ViajesListScreen from '@/screens/viajes/ViajesListScreen';
import FotosGaleriaScreen from '@/screens/fotos/FotosGaleriaScreen';
import PerfilScreen from '@/screens/perfil/PerfilScreen';

// Placeholder icon component — reemplazar con íconos reales en Fase 2
function TabIcon({
  symbol,
  focused,
  isCenter,
}: {
  symbol: string;
  focused: boolean;
  isCenter?: boolean;
}) {
  if (isCenter) {
    return (
      <View style={styles.lumiIconContainer}>
        <View style={styles.lumiIconInner}>
          {/* Placeholder: reemplazar con Feather/Lucide icon */}
        </View>
      </View>
    );
  }
  return (
    <View style={styles.tabIconWrapper}>
      {/* Placeholder text icon — reemplazar con SVG icon en Fase 2 */}
      <View
        style={[
          styles.tabIconDot,
          focused && styles.tabIconDotActive,
        ]}
      />
    </View>
  );
}

// ── Stacks individuales por tab ────────────────────────────

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

const CulturaStack = createNativeStackNavigator<CulturaStackParamList>();
function CulturaStackNavigator() {
  return (
    <CulturaStack.Navigator screenOptions={{ headerShown: false }}>
      <CulturaStack.Screen name="CulturaList" component={CulturaListScreen} />
    </CulturaStack.Navigator>
  );
}

const ViajesStack = createNativeStackNavigator<ViajesStackParamList>();
function ViajesStackNavigator() {
  return (
    <ViajesStack.Navigator screenOptions={{ headerShown: false }}>
      <ViajesStack.Screen name="ViajesList" component={ViajesListScreen} />
    </ViajesStack.Navigator>
  );
}

const FotosStack = createNativeStackNavigator<FotosStackParamList>();
function FotosStackNavigator() {
  return (
    <FotosStack.Navigator screenOptions={{ headerShown: false }}>
      <FotosStack.Screen name="FotosGaleria" component={FotosGaleriaScreen} />
    </FotosStack.Navigator>
  );
}

const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();
function PerfilStackNavigator() {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="Perfil" component={PerfilScreen} />
    </PerfilStack.Navigator>
  );
}

// ── Tab Bar principal ──────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0.5,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: spacing[2],
          elevation: 0,
        },
        tabBarActiveTintColor: colors.purple,
        tabBarInactiveTintColor: colors.textHint,
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'System',
          marginTop: 2,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon
            symbol={route.name}
            focused={focused}
            isCenter={route.name === 'LumiTab' as string}
          />
        ),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="CulturaTab"
        component={CulturaStackNavigator}
        options={{ tabBarLabel: 'Cultura' }}
      />
      <Tab.Screen
        name="ViajesTab"
        component={ViajesStackNavigator}
        options={{ tabBarLabel: 'Viajes' }}
      />
      <Tab.Screen
        name="FotosTab"
        component={FotosStackNavigator}
        options={{ tabBarLabel: 'Fotos' }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilStackNavigator}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textHint,
  },
  tabIconDotActive: {
    backgroundColor: colors.purple,
  },
  lumiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    ...{
      shadowColor: colors.purple,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
  },
  lumiIconInner: {
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    opacity: 0.9,
  },
});
