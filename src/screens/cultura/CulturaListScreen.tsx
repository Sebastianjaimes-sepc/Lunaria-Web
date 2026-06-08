import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, useColors, typography, spacing, borderRadius, shadows } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useCulturaStore } from '@/store/useCulturaStore';
import {
  getCulturaRegistros, createCulturaRegistro,
  updateCulturaRegistro, deleteCulturaRegistro,
  type CreateCulturaInput,
} from '@/services/culturaService';
import { CULTURA_TIPOS, CULTURA_VALORACIONES } from '@/constants';
import type { CulturaRegistro, CulturaTipo, CulturaValoracion } from '@/types/models';
import { formatRelativeDate } from '@/utils/formatDate';

const TIPO_LABEL: Record<CulturaTipo, string> = {
  pelicula: 'Película', serie: 'Serie', libro: 'Libro',
  musica: 'Música', arte: 'Arte', concierto: 'Concierto',
};

const VALORACION_EMOJI: Record<CulturaValoracion, string> = {
  'me marcó': '✦', 'me gustó': '◎', 'no era el momento': '○',
};

// ── Tarjeta ────────────────────────────────────────────────

function RegistroCard({
  item, onEdit, onDelete,
}: {
  item: CulturaRegistro;
  onEdit: (r: CulturaRegistro) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onEdit(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.tipoBadge}>
            <Text style={styles.tipoText}>{TIPO_LABEL[item.tipo]}</Text>
          </View>
          {item.valoracion && (
            <Text style={styles.valoracionEmoji}>{VALORACION_EMOJI[item.valoracion]}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.deleteBtn}>×</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.titulo} numberOfLines={2}>{item.titulo}</Text>
      {item.autor_director
        ? <Text style={styles.meta}>{item.autor_director}{item.anio ? ` · ${item.anio}` : ''}</Text>
        : item.anio ? <Text style={styles.meta}>{item.anio}</Text> : null
      }
      {item.valoracion && <Text style={styles.valoracionText}>{item.valoracion}</Text>}
      {item.notas ? <Text style={styles.notas} numberOfLines={2}>{item.notas}</Text> : null}
      <Text style={styles.fecha}>{formatRelativeDate(item.created_at)}</Text>
    </TouchableOpacity>
  );
}

// ── Modal formulario (crear y editar) ─────────────────────

interface FormModalProps {
  visible: boolean;
  editando: CulturaRegistro | null;
  onClose: () => void;
  onSave: (input: CreateCulturaInput, id?: string) => Promise<void>;
}

function FormModal({ visible, editando, onClose, onSave }: FormModalProps) {
  const [tipo, setTipo] = useState<CulturaTipo>('pelicula');
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [anio, setAnio] = useState('');
  const [valoracion, setValoracion] = useState<CulturaValoracion | null>(null);
  const [notas, setNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Rellenar formulario cuando se edita
  useEffect(() => {
    if (editando) {
      setTipo(editando.tipo);
      setTitulo(editando.titulo);
      setAutor(editando.autor_director ?? '');
      setAnio(editando.anio ?? '');
      setValoracion(editando.valoracion ?? null);
      setNotas(editando.notas ?? '');
    } else {
      setTipo('pelicula'); setTitulo(''); setAutor('');
      setAnio(''); setValoracion(null); setNotas('');
    }
  }, [editando, visible]);

  const handleClose = () => { onClose(); };

  const handleSave = async () => {
    if (!titulo.trim()) { Alert.alert('Falta el título', 'El título es obligatorio.'); return; }
    setIsSaving(true);
    try {
      await onSave(
        { tipo, titulo, autor_director: autor || null, anio: anio || null, valoracion, notas: notas || null },
        editando?.id
      );
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{editando ? 'Editar registro' : 'Nuevo registro'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color={colors.purple} /> : <Text style={styles.modalSave}>Guardar</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.formLabel}>Tipo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {CULTURA_TIPOS.map((t) => (
              <TouchableOpacity key={t} style={[styles.chip, tipo === t && styles.chipActive]} onPress={() => setTipo(t)}>
                <Text style={[styles.chipText, tipo === t && styles.chipTextActive]}>{TIPO_LABEL[t]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.formLabel}>Título *</Text>
          <TextInput style={styles.formInput} value={titulo} onChangeText={setTitulo}
            placeholder="Título" placeholderTextColor={colors.textHint} autoCapitalize="sentences" />

          <Text style={styles.formLabel}>{tipo === 'pelicula' || tipo === 'serie' ? 'Directora / Director' : 'Autora / Autor'}</Text>
          <TextInput style={styles.formInput} value={autor} onChangeText={setAutor}
            placeholder="Opcional" placeholderTextColor={colors.textHint} autoCapitalize="words" />

          <Text style={styles.formLabel}>Año</Text>
          <TextInput style={styles.formInput} value={anio} onChangeText={setAnio}
            placeholder="2024" placeholderTextColor={colors.textHint} keyboardType="number-pad" maxLength={4} />

          <Text style={styles.formLabel}>¿Cómo fue?</Text>
          <View style={styles.valoracionRow}>
            {CULTURA_VALORACIONES.map((v) => (
              <TouchableOpacity key={v}
                style={[styles.valoracionChip, valoracion === v && styles.valoracionChipActive]}
                onPress={() => setValoracion(valoracion === v ? null : v)}>
                <Text style={[styles.valoracionChipText, valoracion === v && styles.valoracionChipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Notas personales</Text>
          <TextInput style={[styles.formInput, styles.formInputMultiline]} value={notas} onChangeText={setNotas}
            placeholder="¿Qué te dejó? ¿Qué pensaste?" placeholderTextColor={colors.textHint}
            multiline numberOfLines={4} textAlignVertical="top" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────

export default function CulturaListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const { registros, filtroActivo, isLoading, setRegistros, setFiltro, setLoading, addRegistro, updateRegistro, removeRegistro } = useCulturaStore();

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<CulturaRegistro | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    getCulturaRegistros(session.user.id)
      .then(setRegistros)
      .catch(() => Alert.alert('Error', 'No se pudieron cargar los registros.'))
      .finally(() => setLoading(false));
  }, [session?.user?.id, setLoading, setRegistros]);

  const handleOpenEdit = useCallback((r: CulturaRegistro) => {
    setEditando(r);
    setShowForm(true);
  }, []);

  const handleOpenNew = useCallback(() => {
    setEditando(null);
    setShowForm(true);
  }, []);

  const handleClose = useCallback(() => {
    setShowForm(false);
    setEditando(null);
  }, []);

  const handleSave = useCallback(async (input: CreateCulturaInput, id?: string) => {
    if (!session?.user?.id) return;
    if (id) {
      const updated = await updateCulturaRegistro(id, input);
      updateRegistro(id, updated);
    } else {
      const nuevo = await createCulturaRegistro(session.user.id, input);
      addRegistro(nuevo);
    }
  }, [session, addRegistro, updateRegistro]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteCulturaRegistro(id); removeRegistro(id); }
        catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  }, [removeRegistro]);

  const FILTROS: Array<CulturaTipo | 'todos'> = ['todos', 'pelicula', 'serie', 'libro', 'musica', 'arte'];
  const FILTRO_LABEL: Record<string, string> = { todos: 'Todo', pelicula: 'Cine', serie: 'Series', libro: 'Libros', musica: 'Música', arte: 'Arte' };
  const filtered = registros
    .filter((r) => filtroActivo === 'todos' || r.tipo === filtroActivo)
    .filter((r) => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return r.titulo.toLowerCase().includes(q) ||
        (r.autor_director?.toLowerCase().includes(q) ?? false) ||
        (r.notas?.toLowerCase().includes(q) ?? false);
    });

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Cultura</Text>
          <Text style={[styles.headerSub, { color: colors.textHint }]}>{registros.length} registros</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: showSearch ? colors.purpleLight : colors.purpleLight, borderWidth: 0.5, borderColor: colors.purpleBorder }]}
            onPress={() => { setShowSearch(!showSearch); if (showSearch) setBusqueda(''); }}
            activeOpacity={0.8}
          >
            <Text style={[styles.addBtnText, { color: colors.purple }]}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.purple }]} onPress={handleOpenNew} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.cream, borderColor: colors.border, color: colors.textPrimary }]}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar por título, autor..."
            placeholderTextColor={colors.textHint}
            autoFocus
            returnKeyType="search"
          />
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.filtroScroll, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filtroContent}>
        {FILTROS.map((f) => (
          <TouchableOpacity key={f}
            style={[styles.filtroChip, { borderColor: colors.border, backgroundColor: colors.cream }, filtroActivo === f && styles.filtroChipActive]}
            onPress={() => setFiltro(f)}>
            <Text style={[styles.filtroText, { color: colors.textSecondary }, filtroActivo === f && styles.filtroTextActive]}>
              {FILTRO_LABEL[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.purple} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RegistroCard item={item} onEdit={handleOpenEdit} onDelete={handleDelete} />}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin registros aún</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Toca "+ Nuevo" para añadir tu primera película, libro o más.</Text>
            </View>
          }
        />
      )}

      <FormModal visible={showForm} editando={editando} onClose={handleClose} onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 0.5 },
  headerTitle: { ...typography.screenTitle },
  headerSub: { ...typography.label, marginTop: 1 },
  addBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full },
  addBtnText: { ...typography.label, color: '#fff', fontFamily: 'DMSans-Medium' },
  filtroScroll: { maxHeight: 44, borderBottomWidth: 0.5 },
  filtroContent: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], gap: spacing[2] },
  filtroChip: { paddingHorizontal: spacing[3], paddingVertical: 5, borderRadius: borderRadius.full, borderWidth: 0.5 },
  filtroChipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  filtroText: { ...typography.label },
  filtroTextActive: { color: '#fff', fontFamily: 'DMSans-Medium' },
  listContent: { padding: spacing[3], gap: spacing[3] },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border, borderRadius: borderRadius.lg, padding: spacing[4], gap: spacing[1], ...shadows.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  tipoBadge: { backgroundColor: colors.purpleLight, paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: borderRadius.sm, borderWidth: 0.5, borderColor: colors.purpleBorder },
  tipoText: { ...typography.micro, color: colors.purple, fontFamily: 'DMSans-Medium' },
  valoracionEmoji: { fontSize: 14, color: colors.purple },
  deleteBtn: { fontSize: 22, color: colors.textHint, lineHeight: 26 },
  titulo: { ...typography.cardTitle, color: colors.textPrimary },
  meta: { ...typography.label, color: colors.textHint },
  valoracionText: { ...typography.label, color: colors.purple, fontStyle: 'italic' },
  notas: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20, marginTop: spacing[1] },
  fecha: { ...typography.micro, color: colors.textHint, marginTop: spacing[1] },
  searchBar: { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderBottomWidth: 0.5 },
  searchInput: { height: 38, borderWidth: 0.5, borderRadius: borderRadius.full, paddingHorizontal: spacing[3], ...typography.bodySmall },
  empty: { alignItems: 'center', paddingTop: spacing['2xl'], paddingHorizontal: spacing.xl, gap: spacing[2] },
  emptyTitle: { ...typography.sectionTitle },
  emptySub: { ...typography.body, textAlign: 'center', lineHeight: 22 },
  modalContainer: { flex: 1, backgroundColor: colors.cream },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  modalTitle: { ...typography.bodySmall, fontFamily: 'DMSans-Medium', color: colors.textPrimary },
  modalCancel: { ...typography.bodySmall, color: colors.textSecondary },
  modalSave: { ...typography.bodySmall, color: colors.purple, fontFamily: 'DMSans-Medium' },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: spacing[4], gap: spacing[1], paddingBottom: spacing['2xl'] },
  formLabel: { ...typography.label, color: colors.textSecondary, fontFamily: 'DMSans-Medium', marginBottom: spacing[1], marginTop: spacing[3] },
  formInput: { backgroundColor: colors.surface, borderWidth: 0.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: spacing[3], height: 44, ...typography.bodySmall, color: colors.textPrimary },
  formInputMultiline: { height: 100, paddingTop: spacing[3] },
  chipScroll: { marginBottom: spacing[1] },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], marginRight: spacing[2], borderRadius: borderRadius.full, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontFamily: 'DMSans-Medium' },
  valoracionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  valoracionChip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.surface },
  valoracionChipActive: { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder },
  valoracionChipText: { ...typography.label, color: colors.textSecondary },
  valoracionChipTextActive: { color: colors.purple, fontFamily: 'DMSans-Medium' },
});
