import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';

/**
 * PerfilScreen — Placeholder para Fase 2.
 * Se implementa completamente en la siguiente fase de desarrollo.
 */
export default function PerfilScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.dot} />
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Próximamente en Fase 2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  dot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.purpleLight,
    marginBottom: spacing[2],
  },
  title: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
