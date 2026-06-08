import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';

// ── Auth Stack ─────────────────────────────────────────────
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

// ── Main Tab Bar ───────────────────────────────────────────
export type MainTabParamList = {
  HomeTab: undefined;
  CulturaTab: undefined;
  ViajesTab: undefined;
  FotosTab: undefined;
  PerfilTab: undefined;
};

// ── Home Stack ─────────────────────────────────────────────
export type HomeStackParamList = {
  Home: undefined;
};

// ── Cultura Stack ──────────────────────────────────────────
export type CulturaStackParamList = {
  CulturaList: undefined;
  CulturaDetail: { id: string };
  CulturaForm: { id?: string };
};

// ── Viajes Stack ───────────────────────────────────────────
export type ViajesStackParamList = {
  ViajesList: undefined;
  ViajeDetail: { id: string };
  ViajeForm: { id?: string };
};

// ── Fotos Stack ────────────────────────────────────────────
export type FotosStackParamList = {
  FotosGaleria: undefined;
  FotoDetail: { id: string };
};

// ── Lumi Stack ─────────────────────────────────────────────
export type LumiStackParamList = {
  Lumi: undefined;
};

// ── Perfil Stack ───────────────────────────────────────────
export type PerfilStackParamList = {
  Perfil: undefined;
};

// ── Screen Props helpers ───────────────────────────────────
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type HomeScreenProps<T extends keyof HomeStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type CulturaScreenProps<T extends keyof CulturaStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<CulturaStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type ViajesScreenProps<T extends keyof ViajesStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ViajesStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type FotosScreenProps<T extends keyof FotosStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<FotosStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;
