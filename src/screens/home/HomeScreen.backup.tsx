import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, typography, spacing, borderRadius, shadows } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { signOut } from '@/services/authService';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getCurrentDateLabel(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface QuickCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

function QuickCard({ title, subtitle, onPress }: QuickCardProps) {
  return (
    <TouchableOpacity
      style={styles.quickCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickCardIconPlaceholder} />
      <Text style={styles.quickCardTitle}>{title}</Text>
      <Text style={styles.quickCardSub}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();

  const firstName = profile?.nombre?.split(' ')[0] ?? 'por aquí';

  async function handleSignOut() {
    Alert.alert(
      'Cerrar sesión',
      '¿Segura que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch {
              Alert.alert('Error', 'No pudimos cerrar la sesión.');
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Saludo */}
        <View style={styles.greeting}>
          <Text style={styles.dateLabel}>{getCurrentDateLabel()}</Text>
          <Text style={styles.greetingText}>
            {getGreeting()}, {firstName}
          </Text>
          <Text style={styles.greetingSubtitle}>¿Qué registras hoy?</Text>
        </View>

        {/* Accesos rápidos */}
        <Text style={styles.sectionLabel}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          <QuickCard title="Cultura" subtitle="Películas, libros y más" onPress={() => {}} />
          <QuickCard title="Viajes" subtitle="Planifica y recuerda" onPress={() => {}} />
          <QuickCard title="Fotos" subtitle="Tus recuerdos" onPress={() => {}} />
          <QuickCard title="Lumi" subtitle="Tu asistente" onPress={() => {}} />
        </View>

        {/* Estado vacío — se reemplaza en Fase 2 con datos reales */}
        <Text style={styles.sectionLabel}>Actividad reciente</Text>
        <View style={styles.emptyState}>
          <View style={styles.emptyDot} />
          <Text style={styles.emptyTitle}>Todo listo</Text>
          <Text style={styles.emptySubtitle}>
            Cuando registres tu primera película o viaje, aparecerá aquí.
          </Text>
        </View>

        {/* Botón de cierre de sesión temporal — se moverá a Perfil en Fase 2 */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing['2xl'],
  },
  greeting: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dateLabel: {
    ...typography.label,
    color: colors.textHint,
    marginBottom: spacing[1],
    textTransform: 'capitalize',
  },
  greetingText: {
    ...typography.greeting,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  greetingSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    fontFamily: 'DMSans-Medium',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing[2],
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing[2],
  },
  quickCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  quickCardIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.purpleLight,
    marginBottom: spacing[2],
  },
  quickCardTitle: {
    ...typography.bodySmall,
    fontFamily: 'DMSans-Medium',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickCardSub: {
    ...typography.label,
    color: colors.textHint,
  },
  emptyState: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing[2],
  },
  emptyDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.purpleLight,
    marginBottom: spacing[2],
  },
  emptyTitle: {
    ...typography.cardTitle,
    color: colors.textPrimary,
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  signOutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing[3],
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  signOutText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
