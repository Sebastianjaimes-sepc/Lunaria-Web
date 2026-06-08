import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AuthScreenProps } from '@/types/navigation';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { signUp } from '@/services/authService';

type Props = AuthScreenProps<'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Campos incompletos', 'Por favor rellena todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Verifica que ambas contraseñas sean iguales.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signUp(email, password);
      if (result.user && !result.session) {
        // Supabase puede requerir confirmación de email
        Alert.alert(
          'Revisa tu email',
          'Te enviamos un enlace de confirmación. Una vez confirmado, podrás iniciar sesión.',
          [{ text: 'Entendido', onPress: () => navigation.navigate('Login') }]
        );
      }
      // Si hay sesión directa, RootNavigator lo detecta automáticamente
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('No pudimos crear tu cuenta', message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>Lunaria</Text>
          <Text style={styles.subtitle}>Crea tu espacio</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.textHint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={colors.textHint}
              secureTextEntry
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              placeholderTextColor={colors.textHint}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.footerLink}> Iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing['2xl'] },
  logo: { ...typography.greeting, color: colors.purple, marginBottom: spacing[2] },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary },
  form: { gap: spacing.md, marginBottom: spacing.xl },
  fieldGroup: { gap: spacing[2] },
  label: { ...typography.label, color: colors.textSecondary, fontFamily: 'DMSans-Medium' },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
  },
  primaryButton: {
    height: 52,
    backgroundColor: colors.purple,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { ...typography.cardTitle, color: colors.textOnPurple },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...typography.bodySmall, color: colors.textSecondary },
  footerLink: { ...typography.bodySmall, color: colors.purple, fontFamily: 'DMSans-Medium' },
});
