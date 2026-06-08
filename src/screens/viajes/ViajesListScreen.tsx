import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, useColors, typography, spacing, borderRadius, shadows } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useViajesStore } from '@/store/useViajesStore';
import { getViajes, createViaje, deleteViaje, type CreateViajeInput } from '@/services/viajesService';
import { VIAJE_ESTADOS } from '@/constants';
import type { Viaje, ViajeEstado } from '@/types/models';
import type { ViajesStackParamList } from '@/types/navigation';
import { formatShortDate } from '@/utils/formatDate';

type Nav = NativeStackNavigationProp<ViajesStackParamList>;

const ESTADO_LABEL: Record<ViajeEstado, string> = { sonado: 'Soñado', planificado: 'Planificado', realizado: 'Realizado' };
const ESTADO_COLOR: Record<ViajeEstado, string> = { sonado: colors.terra, planificado: colors.teal, realizado: colors.purple };

// ── Tarjeta ────────────────────────────────────────────────

function ViajeCard({ item, onPress, onDelete }: { item: Viaje; onPress: () => void; onDelete: (id: string) => void }) {
  const desde = item.fecha_inicio ? formatShortDate(item.fecha_inicio) : null;
  const hasta = item.fecha_fin ? formatShortDate(item.fecha_fin) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={[styles.estadoBadge, { backgroundColor: ESTADO_COLOR[item.estado] + '22', borderColor: ESTADO_COLOR[item.estado] + '55' }]}>
          <Text style={[styles.estadoText, { color: ESTADO_COLOR[item.estado] }]}>{ESTADO_LABEL[item.estado]}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.deleteBtn}>×</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.nombre}>{item.nombre}</Text>
      {(item.ciudad || item.pais) && <Text style={styles.ubicacion}>{[item.ciudad, item.pais].filter(Boolean).join(', ')}</Text>}
      {(desde || hasta) && <Text style={styles.fechas}>{desde && hasta ? `${desde} → ${hasta}` : desde ?? hasta}</Text>}
      {item.notas ? <Text style={styles.notas} numberOfLines={2}>{item.notas}</Text> : null}
      <Text style={styles.verDetalle}>Ver itinerario →</Text>
    </TouchableOpacity>
  );
}

// ── Modal formulario ───────────────────────────────────────

function FormModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (input: CreateViajeInput) => Promise<void> }) {
  const [nombre, setNombre] = useState('');
  const [pais, setPais] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [estado, setEstado] = useState<ViajeEstado>('sonado');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [notas, setNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => { setNombre(''); setPais(''); setCiudad(''); setEstado('sonado'); setFechaInicio(''); setFechaFin(''); setNotas(''); };
  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!nombre.trim()) { Alert.alert('Falta el nombre', 'El nombre del destino es obligatorio.'); return; }
    setIsSaving(true);
    try {
      await onSave({ nombre, pais: pais || null, ciudad: ciudad || null, estado, notas: notas || null, fecha_inicio: fechaInicio || null, fecha_fin: fechaFin || null });
      reset(); onClose();
    } catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setIsSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.modalContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={handleClose}><Text style={styles.modalCancel}>Cancelar</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Nuevo viaje</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color={colors.purple} /> : <Text style={styles.modalSave}>Guardar</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.formLabel}>Destino *</Text>
          <TextInput style={styles.formInput} value={nombre} onChangeText={setNombre} placeholder="Lisboa, Tokio..." placeholderTextColor={colors.textHint} autoCapitalize="words" />
          <Text style={styles.formLabel}>País</Text>
          <TextInput style={styles.formInput} value={pais} onChangeText={setPais} placeholder="Opcional" placeholderTextColor={colors.textHint} autoCapitalize="words" />
          <Text style={styles.formLabel}>Ciudad</Text>
          <TextInput style={styles.formInput} value={ciudad} onChangeText={setCiudad} placeholder="Opcional" placeholderTextColor={colors.textHint} autoCapitalize="words" />
          <Text style={styles.formLabel}>Estado</Text>
          <View style={styles.estadoRow}>
            {VIAJE_ESTADOS.map((e) => (
              <TouchableOpacity key={e} style={[styles.chip, estado === e && styles.chipActive]} onPress={() => setEstado(e)}>
                <Text style={[styles.chipText, estado === e && styles.chipTextActive]}>{ESTADO_LABEL[e]}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.formLabel}>Fecha inicio</Text>
          <TextInput style={styles.formInput} value={fechaInicio} onChangeText={setFechaInicio} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textHint} keyboardType="numbers-and-punctuation" maxLength={10} />
          <Text style={styles.formLabel}>Fecha fin</Text>
          <TextInput style={styles.formInput} value={fechaFin} onChangeText={setFechaFin} placeholder="AAAA-MM-DD" placeholderTextColor={colors.textHint} keyboardType="numbers-and-punctuation" maxLength={10} />
          <Text style={styles.formLabel}>Notas</Text>
          <TextInput style={[styles.formInput, styles.formInputMultiline]} value={notas} onChangeText={setNotas} placeholder="Por qué quieres ir, qué hacer..." placeholderTextColor={colors.textHint} multiline numberOfLines={3} textAlignVertical="top" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────

export default function ViajesListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { session } = useAuthStore();
  const { viajes, filtroEstado, isLoading, setViajes, setFiltro, setLoading, addViaje, removeViaje } = useViajesStore();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    getViajes(session.user.id).then(setViajes).catch(() => Alert.alert('Error', 'No se pudieron cargar los viajes.')).finally(() => setLoading(false));
  }, [session?.user?.id, setLoading, setViajes]);

  const handleSave = useCallback(async (input: CreateViajeInput) => {
    if (!session?.user?.id) return;
    const nuevo = await createViaje(session.user.id, input);
    addViaje(nuevo);
  }, [session, addViaje]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Eliminar', '¿Eliminar este viaje y sus actividades?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteViaje(id); removeViaje(id); }
        catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  }, [removeViaje]);

  const FILTROS: Array<ViajeEstado | 'todos'> = ['todos', 'sonado', 'planificado', 'realizado'];
  const FILTRO_LABEL: Record<string, string> = { todos: 'Todos', sonado: 'Soñados', planificado: 'Planificados', realizado: 'Realizados' };
  const filtered = filtroEstado === 'todos' ? viajes : viajes.filter((v) => v.estado === filtroEstado);

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Viajes</Text>
          <Text style={[styles.headerSub, { color: colors.textHint }]}>{viajes.length} destinos</Text>
        </View>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.purple }]} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.filtroScroll, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filtroContent}>
        {FILTROS.map((f) => (
          <TouchableOpacity key={f}
            style={[styles.filtroChip, { borderColor: colors.border, backgroundColor: colors.cream }, filtroEstado === f && styles.filtroChipActive]}
            onPress={() => setFiltro(f)}>
            <Text style={[styles.filtroText, { color: colors.textSecondary }, filtroEstado === f && styles.filtroTextActive]}>{FILTRO_LABEL[f]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.purple} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ViajeCard
              item={item}
              onPress={() => navigation.navigate('ViajeDetail', { viajeId: item.id })}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Sin viajes aún</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Agrega un destino soñado, planificado o vivido.</Text>
            </View>
          }
        />
      )}
      <FormModal visible={showForm} onClose={() => setShowForm(false)} onSave={handleSave} />
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
  estadoBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: borderRadius.sm, borderWidth: 0.5 },
  estadoText: { ...typography.micro, fontFamily: 'DMSans-Medium' },
  deleteBtn: { fontSize: 22, color: colors.textHint, lineHeight: 26 },
  nombre: { ...typography.cardTitle, color: colors.textPrimary },
  ubicacion: { ...typography.label, color: colors.textHint },
  fechas: { ...typography.label, color: colors.tealDark },
  notas: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20, marginTop: spacing[1] },
  verDetalle: { ...typography.label, color: colors.purple, marginTop: spacing[1] },
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
  formInputMultiline: { height: 90, paddingTop: spacing[3] },
  estadoRow: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  chip: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: borderRadius.full, borderWidth: 0.5, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { ...typography.label, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontFamily: 'DMSans-Medium' },
});
