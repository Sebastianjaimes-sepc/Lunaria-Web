import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Modal, TextInput, ScrollView,
  Dimensions, Image, FlatList, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, typography, spacing, borderRadius } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useFotosStore } from '@/store/useFotosStore';
import { uploadFoto, createFoto, getFotos, deleteFoto, getFotoSignedUrl } from '@/services/fotosService';
import type { Foto } from '@/types/models';

const CELL_SIZE = (Math.min(Dimensions.get('window').width, 480) - 4) / 3;

// ── Celda de foto ──────────────────────────────────────────

function FotoCell({ foto, onPress }: { foto: Foto & { signedUrl?: string }; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.cell}>
      {foto.signedUrl ? (
        <Image source={{ uri: foto.signedUrl }} style={styles.cellImage} resizeMode="cover" />
      ) : (
        <View style={styles.cellPlaceholder}>
          <ActivityIndicator size="small" color="#B0ABA3" />
        </View>
      )}
      {foto.lugar ? (
        <View style={styles.cellOverlay}>
          <Text style={styles.cellLabel} numberOfLines={1}>{foto.lugar}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ── Modal detalle ──────────────────────────────────────────

function FotoDetailModal({
  foto, visible, onClose, onDelete,
}: {
  foto: (Foto & { signedUrl?: string }) | null;
  visible: boolean;
  onClose: () => void;
  onDelete: (id: string, path: string) => void;
}) {
  const colors = useColors();
  if (!foto) return null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.detailContainer, { backgroundColor: colors.cream }]}>
        <View style={[styles.detailHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.detailClose, { color: colors.purple }]}>← Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert('Eliminar', '¿Eliminar esta foto?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Eliminar', style: 'destructive', onPress: () => { onDelete(foto.id, foto.storage_path); onClose(); } },
            ]);
          }}>
            <Text style={[styles.detailDelete, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>
        {foto.signedUrl ? (
          <Image source={{ uri: foto.signedUrl }} style={styles.detailImage} resizeMode="contain" />
        ) : (
          <View style={styles.detailImagePlaceholder}>
            <ActivityIndicator size="large" color={colors.purple} />
          </View>
        )}
        <ScrollView style={styles.detailMeta} contentContainerStyle={{ padding: spacing[4], gap: spacing[2] }}>
          {foto.lugar ? <Text style={[styles.detailLocation, { color: colors.textPrimary }]}>📍 {foto.lugar}</Text> : null}
          {foto.fecha_foto ? <Text style={[styles.detailDate, { color: colors.textHint }]}>{foto.fecha_foto}</Text> : null}
          {foto.notas ? <Text style={[styles.detailNotes, { color: colors.textSecondary }]}>{foto.notas}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Modal añadir foto ──────────────────────────────────────

function AddFotoModal({
  visible, uri, onClose, onSave,
}: {
  visible: boolean;
  uri: string | null;
  onClose: () => void;
  onSave: (meta: { lugar?: string; notas?: string }) => Promise<void>;
}) {
  const colors = useColors();
  const [lugar, setLugar] = useState('');
  const [notas, setNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => { setLugar(''); setNotas(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ lugar: lugar || undefined, notas: notas || undefined });
      reset();
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.addModalContainer, { backgroundColor: colors.cream }]}>
        <View style={[styles.addModalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Nueva foto</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving
              ? <ActivityIndicator size="small" color={colors.purple} />
              : <Text style={[styles.modalSave, { color: colors.purple }]}>Guardar</Text>
            }
          </TouchableOpacity>
        </View>
        {uri ? (
          <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
        ) : null}
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[3] }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Lugar</Text>
          <TextInput
            style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={lugar} onChangeText={setLugar}
            placeholder="¿Dónde fue?" placeholderTextColor={colors.textHint} autoCapitalize="words"
          />
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Nota</Text>
          <TextInput
            style={[styles.formInput, styles.formInputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={notas} onChangeText={setNotas}
            placeholder="¿Qué recuerdas de este momento?" placeholderTextColor={colors.textHint}
            multiline numberOfLines={3} textAlignVertical="top"
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────

type FotoWithUrl = Foto & { signedUrl?: string };

export default function FotosGaleriaScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { session } = useAuthStore();
  const { fotos, isLoading, setFotos, setLoading, addFoto, removeFoto } = useFotosStore();

  const [fotosWithUrls, setFotosWithUrls] = useState<FotoWithUrl[]>([]);
  const [selectedFoto, setSelectedFoto] = useState<FotoWithUrl | null>(null);
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar fotos al montar (solo si no hay datos ya cargados por useAuth)
  useEffect(() => {
    if (!session?.user?.id) return;
    if (fotos.length > 0) return;
    setLoading(true);
    getFotos(session.user.id)
      .then(setFotos)
      .catch(() => Alert.alert('Error', 'No se pudieron cargar las fotos.'))
      .finally(() => setLoading(false));
  }, [session?.user?.id, setLoading, setFotos, fotos.length]);

  // Resolver URLs firmadas
  useEffect(() => {
    let cancelled = false;
    async function resolveUrls() {
      const resolved = await Promise.all(
        fotos.map(async (f) => {
          try {
            const signedUrl = await getFotoSignedUrl(f.storage_path);
            return { ...f, signedUrl };
          } catch {
            return { ...f, signedUrl: undefined };
          }
        })
      );
      if (!cancelled) setFotosWithUrls(resolved);
    }
    resolveUrls();
    return () => { cancelled = true; };
  }, [fotos]);

  // Seleccionar imagen — web vs native
  const handlePickImage = useCallback(async () => {
    if (Platform.OS === 'web') {
      // En web usamos un input file hidden
      fileInputRef.current?.click();
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
      allowsEditing: false,
      quality: 0.9,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setPendingUri(uri);
    setPendingFile(null);
    setShowAddModal(true);
  }, []);

  // Handler para input web
  const handleWebFileChange = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const uri = URL.createObjectURL(file);
    setPendingUri(uri);
    setPendingFile(file);
    setShowAddModal(true);
    input.value = '';
  }, []);

  // Montar input web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    input.addEventListener('change', handleWebFileChange);
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => {
      input.removeEventListener('change', handleWebFileChange);
      document.body.removeChild(input);
    };
  }, [handleWebFileChange]);

  // Guardar foto
  const handleSaveFoto = useCallback(async (meta: { lugar?: string; notas?: string }) => {
    if (!session?.user?.id) return;
    setIsUploading(true);
    try {
      let storagePath: string;
      if (Platform.OS === 'web' && pendingFile) {
        // Web: subir el File directamente
        storagePath = await uploadFotoWeb(session.user.id, pendingFile);
      } else if (pendingUri) {
        storagePath = await uploadFoto(session.user.id, pendingUri);
      } else {
        throw new Error('No hay imagen seleccionada');
      }
      const nuevaFoto = await createFoto(session.user.id, storagePath, meta);
      addFoto(nuevaFoto);
      setPendingUri(null);
      setPendingFile(null);
    } finally {
      setIsUploading(false);
    }
  }, [pendingUri, pendingFile, session, addFoto]);

  // Eliminar foto
  const handleDelete = useCallback(async (id: string, path: string) => {
    try {
      await deleteFoto(id, path);
      removeFoto(id);
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la foto.');
    }
  }, [removeFoto]);

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Fotos</Text>
          <Text style={[styles.headerSub, { color: colors.textHint }]}>{fotos.length} recuerdos</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.purple }]}
          onPress={handlePickImage} disabled={isUploading} activeOpacity={0.8}
        >
          {isUploading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.addBtnText}>+ Añadir</Text>
          }
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : fotosWithUrls.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin fotos aún</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Toca "+ Añadir" para guardar tu primer recuerdo.
          </Text>
        </View>
      ) : (
        <FlatList
          data={fotosWithUrls}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
            <FotoCell foto={item} onPress={() => setSelectedFoto(item)} />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FotoDetailModal
        foto={selectedFoto} visible={!!selectedFoto}
        onClose={() => setSelectedFoto(null)} onDelete={handleDelete}
      />
      <AddFotoModal
        visible={showAddModal} uri={pendingUri}
        onClose={() => { setShowAddModal(false); setPendingUri(null); setPendingFile(null); }}
        onSave={handleSaveFoto}
      />
    </View>
  );
}

// Upload web usando fetch directo con ArrayBuffer desde File
async function uploadFotoWeb(userId: string, file: File): Promise<string> {
  const { supabase } = await import('@/lib/supabase');
  const Constants = (await import('expo-constants')).default;
  const SUPABASE_URL: string = (Constants.expoConfig?.extra?.supabaseUrl as string) ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const SUPABASE_ANON_KEY: string = (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  const arrayBuffer = await file.arrayBuffer();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) throw new Error('Sin sesión activa.');

  const fileName = `${Date.now()}.jpg`;
  const filePath = `${userId}/${new Date().getFullYear()}/${fileName}`;
  const url = `${SUPABASE_URL}/storage/v1/object/fotos/${filePath}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': file.type || 'image/jpeg',
      'x-upsert': 'true',
    },
    body: arrayBuffer,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.status.toString());
    throw new Error(`Upload falló (${res.status}): ${body}`);
  }
  return filePath;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 0.5 },
  headerTitle: { ...typography.screenTitle },
  headerSub: { ...typography.label, marginTop: 1 },
  addBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  addBtnText: { ...typography.label, color: '#fff', fontFamily: 'DMSans-Medium' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing[2] },
  emptyTitle: { ...typography.sectionTitle },
  emptySub: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  cell: { width: CELL_SIZE, height: CELL_SIZE, margin: 0.5 },
  cellImage: { width: '100%', height: '100%' },
  cellPlaceholder: { width: '100%', height: '100%', backgroundColor: '#E8E4DC', alignItems: 'center', justifyContent: 'center' },
  cellOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.3)', padding: 4 },
  cellLabel: { fontSize: 9, color: '#fff' },
  detailContainer: { flex: 1 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 0.5 },
  detailClose: { ...typography.bodySmall, fontFamily: 'DMSans-Medium' },
  detailDelete: { ...typography.bodySmall },
  detailImage: { width: '100%', height: 340 },
  detailImagePlaceholder: { width: '100%', height: 340, alignItems: 'center', justifyContent: 'center' },
  detailMeta: { flex: 1 },
  detailLocation: { ...typography.cardTitle },
  detailDate: { ...typography.label },
  detailNotes: { ...typography.body, lineHeight: 22 },
  addModalContainer: { flex: 1 },
  addModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 0.5 },
  modalTitle: { ...typography.bodySmall, fontFamily: 'DMSans-Medium' },
  modalCancel: { ...typography.bodySmall },
  modalSave: { ...typography.bodySmall, fontFamily: 'DMSans-Medium' },
  previewImage: { width: '100%', height: 220 },
  formLabel: { ...typography.label, fontFamily: 'DMSans-Medium', marginBottom: spacing[1] },
  formInput: { borderWidth: 0.5, borderRadius: borderRadius.md, paddingHorizontal: spacing[3], height: 44, ...typography.bodySmall },
  formInputMulti: { height: 90, paddingTop: spacing[3] },
});
