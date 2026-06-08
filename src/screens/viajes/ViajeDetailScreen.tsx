import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useColors, typography, spacing, borderRadius, shadows } from '@/theme';
import {
  getActividades, createActividad, toggleActividadCompletada,
  deleteActividad,
} from '@/services/viajesService';
import { supabase as _supabase } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import type { Viaje, Actividad, ViajeEstado } from '@/types/models';
import type { ViajesStackParamList } from '@/types/navigation';
import { formatShortDate } from '@/utils/formatDate';

type RouteProps = RouteProp<ViajesStackParamList, 'ViajeDetail'>;

const ESTADO_LABEL: Record<ViajeEstado, string> = {
  sonado: 'Soñado', planificado: 'Planificado', realizado: 'Realizado',
};

const TIPO_ICON: Record<string, string> = {
  llegada: '✈', museo: '🏛', comida: '🍽', caminata: '🚶',
  transporte: '🚌', alojamiento: '🏨', compras: '🛍', otro: '📌',
};

// ── Modal añadir actividad ─────────────────────────────────

function AddActividadModal({
  visible, viajeId, diaNumero, onClose, onSave,
}: {
  visible: boolean;
  viajeId: string;
  diaNumero: number;
  onClose: () => void;
  onSave: (a: Actividad) => void;
}) {
  const colors = useColors();
  const [titulo, setTitulo] = useState('');
  const [hora, setHora] = useState('');
  const [notas, setNotas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => { setTitulo(''); setHora(''); setNotas(''); };

  const handleSave = async () => {
    if (!titulo.trim()) { Alert.alert('Falta el título', 'Escribe qué vas a hacer.'); return; }
    setIsSaving(true);
    try {
      const nueva = await createActividad({ viaje_id: viajeId, dia_numero: diaNumero, titulo, hora: hora || null, notas: notas || null });
      onSave(nueva);
      reset();
      onClose();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={[styles.modalContainer, { backgroundColor: colors.cream }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { reset(); onClose(); }}>
            <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Día {diaNumero}</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator size="small" color={colors.purple} /> : <Text style={[styles.modalSave, { color: colors.purple }]}>Añadir</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing[4], gap: spacing[2] }} keyboardShouldPersistTaps="handled">
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>¿Qué vas a hacer? *</Text>
          <TextInput style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={titulo} onChangeText={setTitulo} placeholder="Visitar museo, comer en..." placeholderTextColor={colors.textHint} autoCapitalize="sentences" />
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Hora</Text>
          <TextInput style={[styles.formInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={hora} onChangeText={setHora} placeholder="10:00" placeholderTextColor={colors.textHint} keyboardType="numbers-and-punctuation" />
          <Text style={[styles.formLabel, { color: colors.textSecondary }]}>Notas</Text>
          <TextInput style={[styles.formInput, styles.formInputMulti, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
            value={notas} onChangeText={setNotas} placeholder="Dirección, reserva, tips..." placeholderTextColor={colors.textHint} multiline textAlignVertical="top" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────

export default function ViajeDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { viajeId } = route.params;
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(1);
  const [diaActual, setDiaActual] = useState(1);

  // Cargar viaje y actividades
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [{ data: vData }, acts] = await Promise.all([
          supabase.from('viajes').select('*').eq('id', viajeId).single(),
          getActividades(viajeId),
        ]);
        if (vData) setViaje(vData as Viaje);
        setActividades(acts);
      } catch {
        Alert.alert('Error', 'No se pudo cargar el viaje.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [viajeId]);

  // Calcular días totales del viaje
  const totalDias = (() => {
    if (!viaje?.fecha_inicio || !viaje?.fecha_fin) return 5;
    const diff = Math.ceil((new Date(viaje.fecha_fin).getTime() - new Date(viaje.fecha_inicio).getTime()) / 86400000);
    return Math.max(diff + 1, 1);
  })();

  const diasNumerados = Array.from({ length: Math.max(totalDias, diaActual) }, (_, i) => i + 1);

  const actividadesDia = actividades.filter((a) => a.dia_numero === diaActual);

  const handleToggle = useCallback(async (a: Actividad) => {
    try {
      await toggleActividadCompletada(a.id, !a.completada);
      setActividades((prev) => prev.map((x) => x.id === a.id ? { ...x, completada: !x.completada } : x));
    } catch { Alert.alert('Error', 'No se pudo actualizar.'); }
  }, []);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Eliminar', '¿Eliminar esta actividad?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteActividad(id); setActividades((prev) => prev.filter((a) => a.id !== id)); }
        catch { Alert.alert('Error', 'No se pudo eliminar.'); }
      }},
    ]);
  }, []);

  const handleNuevoDia = useCallback(() => {
    setDiaActual((d) => d + 1);
  }, []);

  const handleCambiarEstado = useCallback(() => {
    if (!viaje) return;
    const ESTADOS: Viaje['estado'][] = ['sonado', 'planificado', 'realizado'];
    const opciones = ESTADOS.filter((e) => e !== viaje.estado);
    Alert.alert(
      'Cambiar estado',
      `¿Cómo está este viaje a ${viaje.nombre}?`,
      [
        ...opciones.map((e) => ({
          text: { sonado: 'Soñado', planificado: 'Planificado', realizado: 'Realizado' }[e],
          onPress: async () => {
            try {
              await supabase.from('viajes').update({ estado: e }).eq('id', viaje.id);
              setViaje((v) => v ? { ...v, estado: e } : v);
            } catch { Alert.alert('Error', 'No se pudo actualizar el estado.'); }
          },
        })),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  }, [viaje]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.purple} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.purple }]}>← Viajes</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>{viaje?.nombre}</Text>
          {viaje && (
            <Text style={[styles.headerSub, { color: colors.textHint }]}>
              {[viaje.ciudad, viaje.pais].filter(Boolean).join(', ')}
              {viaje.fecha_inicio ? ` · ${formatShortDate(viaje.fecha_inicio)}` : ''}
            </Text>
          )}
        </View>
        {viaje && (
          <TouchableOpacity
            style={[styles.estadoBadge, { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder }]}
            onPress={handleCambiarEstado}
            activeOpacity={0.8}
          >
            <Text style={[styles.estadoText, { color: colors.purple }]}>{ESTADO_LABEL[viaje.estado]} ↓</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Selector de días */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={[styles.diaScroll, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.diaContent}>
        {diasNumerados.map((d) => (
          <TouchableOpacity key={d}
            style={[styles.diaChip, { borderColor: colors.border }, diaActual === d && { backgroundColor: colors.purple, borderColor: colors.purple }]}
            onPress={() => setDiaActual(d)}>
            <Text style={[styles.diaChipText, { color: colors.textSecondary }, diaActual === d && { color: '#fff', fontFamily: 'DMSans-Medium' }]}>
              Día {d}
            </Text>
            {actividades.filter((a) => a.dia_numero === d).length > 0 && (
              <View style={[styles.diaDot, { backgroundColor: diaActual === d ? '#fff' : colors.purple }]} />
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.diaChip, { borderColor: colors.border, borderStyle: 'dashed' }]} onPress={handleNuevoDia}>
          <Text style={[styles.diaChipText, { color: colors.textHint }]}>+ Día</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Actividades del día */}
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing.xl }]}>
        {actividadesDia.length === 0 ? (
          <View style={styles.emptyDia}>
            <Text style={[styles.emptyDiaText, { color: colors.textHint }]}>Sin actividades para el día {diaActual}</Text>
          </View>
        ) : (
          actividadesDia.map((a) => (
            <TouchableOpacity key={a.id}
              style={[styles.actCard, { backgroundColor: colors.surface, borderColor: colors.border }, a.completada && { opacity: 0.6 }]}
              onPress={() => handleToggle(a)} activeOpacity={0.8}>
              <View style={styles.actHeader}>
                <View style={[styles.actCheck, { borderColor: colors.purple }, a.completada && { backgroundColor: colors.purple }]}>
                  {a.completada && <Text style={styles.actCheckMark}>✓</Text>}
                </View>
                <Text style={[styles.actTipo, { color: colors.textHint }]}>{TIPO_ICON[a.tipo] ?? '📌'}</Text>
                {a.hora ? <Text style={[styles.actHora, { color: colors.tealDark }]}>{a.hora}</Text> : null}
                <TouchableOpacity onPress={() => handleDelete(a.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.actDelete}>
                  <Text style={[styles.actDeleteText, { color: colors.textHint }]}>×</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.actTitulo, { color: colors.textPrimary }, a.completada && { textDecorationLine: 'line-through' }]}>
                {a.titulo}
              </Text>
              {a.notas ? <Text style={[styles.actNotas, { color: colors.textSecondary }]} numberOfLines={2}>{a.notas}</Text> : null}
            </TouchableOpacity>
          ))
        )}

        {/* Botón añadir actividad */}
        <TouchableOpacity
          style={[styles.addActBtn, { borderColor: colors.border }]}
          onPress={() => { setDiaSeleccionado(diaActual); setShowAddModal(true); }}
          activeOpacity={0.7}>
          <Text style={[styles.addActText, { color: colors.purple }]}>+ Añadir actividad al día {diaActual}</Text>
        </TouchableOpacity>

        {/* Notas del viaje */}
        {viaje?.notas ? (
          <View style={[styles.notasCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.notasLabel, { color: colors.textSecondary }]}>Notas del viaje</Text>
            <Text style={[styles.notasText, { color: colors.textPrimary }]}>{viaje.notas}</Text>
          </View>
        ) : null}
      </ScrollView>

      <AddActividadModal
        visible={showAddModal}
        viajeId={viajeId}
        diaNumero={diaSeleccionado}
        onClose={() => setShowAddModal(false)}
        onSave={(a) => setActividades((prev) => [...prev, a])}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 0.5, gap: spacing[1] },
  backBtn: { marginBottom: spacing[1] },
  backText: { ...typography.label, fontFamily: 'DMSans-Medium' },
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.sectionTitle },
  headerSub: { ...typography.label, marginTop: 1 },
  estadoBadge: { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: borderRadius.sm, borderWidth: 0.5, alignSelf: 'flex-start' },
  estadoText: { ...typography.micro, fontFamily: 'DMSans-Medium' },
  diaScroll: { maxHeight: 44, borderBottomWidth: 0.5 },
  diaContent: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], gap: spacing[2] },
  diaChip: { paddingHorizontal: spacing[3], paddingVertical: 5, borderRadius: borderRadius.full, borderWidth: 0.5, flexDirection: 'row', alignItems: 'center', gap: 4 },
  diaChipText: { ...typography.label },
  diaDot: { width: 6, height: 6, borderRadius: 3 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing[3], gap: spacing[2] },
  actCard: { borderWidth: 0.5, borderRadius: borderRadius.lg, padding: spacing[3], gap: spacing[1], ...shadows.sm },
  actHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  actCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  actCheckMark: { fontSize: 11, color: '#fff', fontWeight: '700' },
  actTipo: { fontSize: 14 },
  actHora: { ...typography.label, fontFamily: 'DMSans-Medium', flex: 1 },
  actDelete: { marginLeft: 'auto' },
  actDeleteText: { fontSize: 20, lineHeight: 24 },
  actTitulo: { ...typography.bodySmall, fontFamily: 'DMSans-Medium', paddingLeft: spacing[1] },
  actNotas: { ...typography.label, lineHeight: 18, paddingLeft: spacing[1] },
  emptyDia: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyDiaText: { ...typography.body },
  addActBtn: { borderWidth: 0.5, borderRadius: borderRadius.lg, padding: spacing[3], alignItems: 'center', borderStyle: 'dashed' },
  addActText: { ...typography.bodySmall, fontFamily: 'DMSans-Medium' },
  notasCard: { borderWidth: 0.5, borderRadius: borderRadius.lg, padding: spacing[3], gap: spacing[1] },
  notasLabel: { ...typography.label, fontFamily: 'DMSans-Medium' },
  notasText: { ...typography.bodySmall, lineHeight: 20 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 0.5 },
  modalTitle: { ...typography.bodySmall, fontFamily: 'DMSans-Medium' },
  modalCancel: { ...typography.bodySmall },
  modalSave: { ...typography.bodySmall, fontFamily: 'DMSans-Medium' },
  formLabel: { ...typography.label, fontFamily: 'DMSans-Medium', marginBottom: spacing[1] },
  formInput: { borderWidth: 0.5, borderRadius: borderRadius.md, paddingHorizontal: spacing[3], height: 44, ...typography.bodySmall },
  formInputMulti: { height: 80, paddingTop: spacing[3] },
});
