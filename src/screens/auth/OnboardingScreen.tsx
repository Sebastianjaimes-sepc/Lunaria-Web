import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuthScreenProps } from '@/types/navigation';
import { colors, typography, spacing, borderRadius } from '@/theme';

type Props = AuthScreenProps<'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.symbol}>✦</Text>
        <Text style={styles.logo}>Lunaria</Text>
        <Text style={styles.tagline}>Tu espacio cultural íntimo</Text>
        <Text style={styles.description}>
          Registra las películas que te marcaron, los libros que cambiaron tu forma de ver el mundo y los viajes que te formaron.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
          <Text style={styles.primaryButtonText}>Comenzar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
          <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream, paddingHorizontal: spacing.lg, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  symbol: { fontSize: 40, color: colors.purple, marginBottom: spacing[2] },
  logo: { ...typography.greeting, color: colors.purple, fontSize: 42 },
  tagline: { ...typography.sectionTitle, color: colors.textSecondary, textAlign: 'center' },
  description: { ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 300, marginTop: spacing[2], lineHeight: 22 },
  actions: { gap: spacing[3], paddingBottom: spacing.lg },
  primaryButton: { height: 52, backgroundColor: colors.purple, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { ...typography.cardTitle, color: colors.textOnPurple },
  secondaryButton: { height: 52, backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.purpleBorder, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { ...typography.cardTitle, color: colors.purple },
});
