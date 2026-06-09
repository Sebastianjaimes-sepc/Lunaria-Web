import { supabase } from '@/lib/supabase';

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

import { useColors, typography, spacing, borderRadius, shadows, useTheme } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useCulturaStore } from '@/store/useCulturaStore';
import { useViajesStore } from '@/store/useViajesStore';
import { useFotosStore } from '@/store/useFotosStore';
import { signOut, updateProfile, uploadAvatar, getAvatarUrl } from '@/services/authService';

function SectionLabel({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{text}</Text>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color: colors.purple }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textHint }]}>{label}</Text>
    </View>
  );
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDark, toggle: toggleTheme } = useTheme();

  const { session, profile, setProfile } = useAuthStore();
  const registros = useCulturaStore((s) => s.registros);
  const viajes = useViajesStore((s) => s.viajes);
  const fotos = useFotosStore((s) => s.fotos);

  const [nombre, setNombre] = useState(profile?.nombre ?? '');
  const [ciudad, setCiudad] = useState(profile?.ciudad ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setNombre(profile?.nombre ?? '');
    setCiudad(profile?.ciudad ?? '');
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    if (!profile?.avatar_url) { setAvatarUri(null); return; }
    getAvatarUrl(profile.avatar_url).then((url) => {
      if (mounted) setAvatarUri(url);
    }).catch(() => { if (mounted) setAvatarUri(null); });
    return () => { mounted = false; };
  }, [profile?.avatar_url]);

  const handlePickAvatar = useCallback(async () => {
    if (!session?.user?.id) return;

    if (Platform.OS === 'web') {
      // Web: usar input file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const uri = URL.createObjectURL(file);
        setIsUploadingAvatar(true);
        try {
          const avatarPath = await uploadAvatar(session.user.id!, uri, file);
          const updated = await updateProfile(session.user.id!, { avatar_url: avatarPath });
          setProfile(updated);
          Alert.alert('Listo', 'Tu foto fue actualizada.');
        } catch (error) {
          Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      input.click();
      return;
    }

    // Native
    const ImagePicker = require('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setIsUploadingAvatar(true);
    try {
      const avatarPath = await uploadAvatar(session.user.id, uri);
      const updated = await updateProfile(session.user.id, { avatar_url: avatarPath });
      setProfile(updated);
      Alert.alert('Listo', 'Tu foto fue actualizada.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsUploadingAvatar(false);
    }
  }, [session, setProfile]);

  const handleSave = useCallback(async () => {
    if (!session?.user?.id) return;
    const n = nombre.trim(); const c = ciudad.trim();
    if (n === (profile?.nombre ?? '') && c === (profile?.ciudad ?? '')) {
      Alert.alert('Sin cambios', 'No hay nada nuevo que guardar.'); return;
    }
    setIsSaving(true);
    try {
      const updated = await updateProfile(session.user.id, { nombre: n || null, ciudad: c || null });
      setProfile(updated);
      Alert.alert('Guardado', 'Tu perfil fue actualizado.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  }, [session, nombre, ciudad, profile, setProfile]);

const { setSession } = useAuthStore();

const handleSignOut = useCallback(async () => {
  if (Platform.OS === 'web') {
    setIsSigningOut(true);
    try {
      console.log('1. iniciando signOut');
      await supabase.auth.signOut();
      console.log('2. signOut completado');
      try { localStorage.clear(); } catch {}
      console.log('3. localStorage limpio');
      setSession(null);
      console.log('4. session limpia');
    } catch (e) {
      console.log('ERROR:', e);
      setIsSigningOut(false);
    }
    return;
  }
  // ... resto del código
}, [setSession]);

  const peliculasVistas = registros.filter((r) => r.tipo === 'pelicula' || r.tipo === 'serie').length;
  const librosLeidos = registros.filter((r) => r.tipo === 'libro').length;
  const userEmail = session?.user?.email ?? '';

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={[styles.avatarTouchable, { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder }]}
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            disabled={isUploadingAvatar}
          >
            {avatarUri
              ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
              : <Text style={[styles.avatarInitials, { color: colors.purple }]}>
                  {nombre.trim() ? nombre.trim().charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
                </Text>
            }
            {isUploadingAvatar && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            )}
            <View style={[styles.avatarBadge, { backgroundColor: colors.purple, borderColor: colors.cream }]}>
              <Text style={styles.avatarBadgeText}>+</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.emailText, { color: colors.textHint }]}>{userEmail}</Text>
        </View>

        {/* Datos */}
        <SectionLabel text="Mis datos" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nombre</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.textPrimary }]}
              value={nombre} onChangeText={setNombre}
              placeholder="Tu nombre" placeholderTextColor={colors.textHint}
              autoCapitalize="words" maxLength={80}
            />
          </View>
          <View style={[styles.fieldGroup, { marginBottom: 0 }]}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Ciudad</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.textPrimary }]}
              value={ciudad} onChangeText={setCiudad}
              placeholder="Tu ciudad" placeholderTextColor={colors.textHint}
              autoCapitalize="words" returnKeyType="done"
              onSubmitEditing={handleSave} maxLength={80}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.purple }, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave} disabled={isSaving} activeOpacity={0.8}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveButtonText}>Guardar cambios</Text>
          }
        </TouchableOpacity>

        {/* Estadísticas */}
        <SectionLabel text="Mi actividad" />
        <View style={styles.statsGrid}>
          <StatBox value={peliculasVistas} label="Películas" />
          <StatBox value={librosLeidos} label="Libros" />
          <StatBox value={viajes.length} label="Viajes" />
          <StatBox value={fotos.length} label="Fotos" />
        </View>

        {/* Preferencias */}
        <SectionLabel text="Apariencia" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.toggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Modo oscuro</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.purple }}
              thumbColor={isDark ? colors.purpleLight : colors.surface}
            />
          </View>
        </View>

        {/* Cuenta */}
        <SectionLabel text="Cuenta" />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={styles.signOutRow}
            onPress={() => {
    console.log('click cerrar sesion', isSigningOut);
    handleSignOut();
  }}
  disabled={false}
  activeOpacity={0.7}
          >
            {isSigningOut
              ? <ActivityIndicator size="small" color={colors.error} />
              : <Text style={[styles.signOutText, { color: colors.error }]}>Cerrar sesión</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg },
  sectionLabel: {
    ...typography.label, fontFamily: 'DMSans-Medium', letterSpacing: 0.5,
    textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing[2],
  },
  avatarSection: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing[2] },
  avatarTouchable: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarOverlay: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  avatarInitials: { fontSize: 28, fontFamily: 'DMSans-Medium' },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 22, height: 22,
    borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  avatarBadgeText: { fontSize: 14, color: '#fff', lineHeight: 18 },
  emailText: { ...typography.label },
  card: { borderWidth: 0.5, borderRadius: borderRadius.lg, paddingVertical: spacing[3], paddingHorizontal: spacing[4], ...shadows.sm },
  fieldGroup: { marginBottom: spacing[3], gap: spacing[1] },
  fieldLabel: { ...typography.label, fontFamily: 'DMSans-Medium' },
  input: {
    height: 44, borderWidth: 0.5, borderRadius: borderRadius.md,
    paddingHorizontal: spacing[3], ...typography.bodySmall,
  },
  saveButton: { height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing[3] },
  saveButtonDisabled: { opacity: 0.65 },
  saveButtonText: { ...typography.bodySmall, fontFamily: 'DMSans-Medium', color: '#fff' },
  statsGrid: { flexDirection: 'row', gap: spacing[2] },
  statBox: { flex: 1, borderWidth: 0.5, borderRadius: borderRadius.lg, paddingVertical: spacing[3], alignItems: 'center', gap: 2, ...shadows.sm },
  statValue: { fontSize: 22, fontFamily: 'DMSans-Medium' },
  statLabel: { ...typography.micro, textAlign: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { ...typography.bodySmall },
  signOutRow: { alignItems: 'center', paddingVertical: spacing[1] },
  signOutText: { ...typography.bodySmall },
});
