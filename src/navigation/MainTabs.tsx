import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  MainTabParamList,
  HomeStackParamList,
  CulturaStackParamList,
  ViajesStackParamList,
  FotosStackParamList,
  LumiStackParamList,
  PerfilStackParamList,
} from '@/types/navigation';
import { colors, spacing } from '@/theme';

import HomeScreen from '@/screens/home/HomeScreen';
import CulturaListScreen from '@/screens/cultura/CulturaListScreen';
import ViajesListScreen from '@/screens/viajes/ViajesListScreen';
import ViajeDetailScreen from '@/screens/viajes/ViajeDetailScreen';
import FotosGaleriaScreen from '@/screens/fotos/FotosGaleriaScreen';
import LumiScreen from '@/screens/lumi/LumiScreen';
import PerfilScreen from '@/screens/perfil/PerfilScreen';

// ── Tab icon helpers ───────────────────────────────────────

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  );
}

function TabDot({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIconWrapper}>
      <View style={[styles.tabIconDot, focused && styles.tabIconDotActive]} />
    </View>
  );
}

function LumiTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.lumiIconContainer, focused && styles.lumiIconFocused]}>
      <Text style={styles.lumiIconText}>✦</Text>
    </View>
  );
}

// ── Stack navigators ───────────────────────────────────────

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
      <ViajesStack.Screen name="ViajeDetail" component={ViajeDetailScreen} />
    </ViajesStack.Navigator>
  );
}

const LumiStack = createNativeStackNavigator<LumiStackParamList>();
function LumiStackNavigator() {
  return (
    <LumiStack.Navigator screenOptions={{ headerShown: false }}>
      <LumiStack.Screen name="Lumi" component={LumiScreen} />
    </LumiStack.Navigator>
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

// ── Tab bar principal ──────────────────────────────────────

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
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
        // Ocultamos el label por defecto — los definimos inline por tab
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Inicio" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tab.Screen
        name="CulturaTab"
        component={CulturaStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Cultura" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tab.Screen
        name="ViajesTab"
        component={ViajesStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Viajes" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tab.Screen
        name="LumiTab"
        component={LumiStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <LumiTabIcon focused={focused} />,
          tabBarLabel: ({ focused }) => (
            <TabLabel label="Lumi" focused={focused} />
          ),
          tabBarShowLabel: true,
        }}
      />
      <Tab.Screen
        name="FotosTab"
        component={FotosStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Fotos" focused={focused} />,
          tabBarShowLabel: true,
        }}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilStackNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabDot focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Perfil" focused={focused} />,
          tabBarShowLabel: true,
        }}
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
  tabLabel: {
    fontSize: 10,
    fontFamily: 'DMSans-Regular',
    color: colors.textHint,
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  tabLabelActive: {
    color: colors.purple,
    fontFamily: 'DMSans-Medium',
  },
  lumiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
  },
  lumiIconFocused: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  lumiIconText: {
    fontSize: 15,
    color: colors.purple,
  },
});
