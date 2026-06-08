import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useColors, typography, spacing, borderRadius, shadows } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useCulturaStore } from '@/store/useCulturaStore';
import { useViajesStore } from '@/store/useViajesStore';
import { useFotosStore } from '@/store/useFotosStore';
import type { MainTabParamList } from '@/types/navigation';
import { formatRelativeDate, formatShortDate } from '@/utils/formatDate';

type HomeNav = BottomTabNavigationProp<MainTabParamList>;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getCurrentDateLabel(): string {
  return new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const navigation = useNavigation<HomeNav>();
  const { profile } = useAuthStore();
  const registros = useCulturaStore((s) => s.registros);
  const viajes = useViajesStore((s) => s.viajes);
  const fotos = useFotosStore((s) => s.fotos);

  const firstName = profile?.nombre?.split(' ')[0] ?? 'Luisa';
  const ultimoRegistro = registros[0] ?? null;
  const proximoViaje = viajes.find((v) => v.estado === 'planificado') ?? viajes.find((v) => v.estado === 'sonado') ?? null;

  const QUICK = [
    { title: 'Cultura', sub: `${registros.length} registros`, tab: 'CulturaTab' as keyof MainTabParamList },
    { title: 'Viajes', sub: `${viajes.length} destinos`, tab: 'ViajesTab' as keyof MainTabParamList },
    { title: 'Fotos', sub: `${fotos.length} recuerdos`, tab: 'FotosTab' as keyof MainTabParamList },
    { title: 'Lumi', sub: 'Tu asistente', tab: 'LumiTab' as keyof MainTabParamList },
  ];

  const TIPO_LABEL: Record<string, string> = {
    pelicula: 'Película', serie: 'Serie', libro: 'Libro',
    musica: 'Música', arte: 'Arte', concierto: 'Concierto',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cream, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Saludo */}
        <View style={styles.greeting}>
          <Text style={[styles.dateLabel, { color: colors.textHint }]}>{getCurrentDateLabel()}</Text>
          <Text style={[styles.greetingText, { color: colors.textPrimary }]}>
            {getGreeting()}, {firstName}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>¿Qué registras hoy?</Text>
        </View>

        {/* Accesos rápidos */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Accesos rápidos</Text>
        <View style={styles.quickGrid}>
          {QUICK.map((q) => (
            <TouchableOpacity
              key={q.tab}
              style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate(q.tab)}
              activeOpacity={0.7}
            >
              <View style={[styles.quickCardDot, { backgroundColor: colors.purpleLight }]} />
              <Text style={[styles.quickCardTitle, { color: colors.textPrimary }]}>{q.title}</Text>
              <Text style={[styles.quickCardSub, { color: colors.textHint }]}>{q.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Último registro */}
        {ultimoRegistro ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Último registro</Text>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('CulturaTab')}
              activeOpacity={0.8}
            >
              <View style={styles.cardRow}>
                <View style={[styles.tipoBadge, { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder }]}>
                  <Text style={[styles.tipoText, { color: colors.purple }]}>
                    {TIPO_LABEL[ultimoRegistro.tipo] ?? ultimoRegistro.tipo}
                  </Text>
                </View>
                <Text style={[styles.cardMeta, { color: colors.textHint }]}>
                  {formatRelativeDate(ultimoRegistro.created_at)}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {ultimoRegistro.titulo}
              </Text>
              {ultimoRegistro.valoracion ? (
                <Text style={[styles.cardSub, { color: colors.purple }]}>{ultimoRegistro.valoracion}</Text>
              ) : null}
            </TouchableOpacity>
          </>
        ) : null}

        {/* Próximo viaje */}
        {proximoViaje ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
              {proximoViaje.estado === 'planificado' ? 'Próximo viaje' : 'Viaje soñado'}
            </Text>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ViajesTab')}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{proximoViaje.nombre}</Text>
              {(proximoViaje.ciudad || proximoViaje.pais) ? (
                <Text style={[styles.cardSub, { color: colors.textHint }]}>
                  {[proximoViaje.ciudad, proximoViaje.pais].filter(Boolean).join(', ')}
                </Text>
              ) : null}
              {proximoViaje.fecha_inicio ? (
                <Text style={[styles.cardMeta, { color: colors.tealDark }]}>
                  {formatShortDate(proximoViaje.fecha_inicio)}
                </Text>
              ) : null}
            </TouchableOpacity>
          </>
        ) : null}

        {/* Estado vacío */}
        {!ultimoRegistro && !proximoViaje ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Actividad reciente</Text>
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.emptyDot, { backgroundColor: colors.purpleLight }]} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Todo listo</Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Cuando registres tu primera película o viaje, aparecerá aquí.
              </Text>
            </View>
          </>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: spacing['2xl'] },
  greeting: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md,
  },
  dateLabel: { ...typography.label, marginBottom: spacing[1], textTransform: 'capitalize' },
  greetingText: { ...typography.greeting, marginBottom: spacing[1] },
  greetingSubtitle: { ...typography.body },
  sectionLabel: {
    ...typography.label, fontFamily: 'DMSans-Medium', letterSpacing: 0.5,
    textTransform: 'uppercase', paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg, paddingBottom: spacing[2],
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing[2] },
  quickCard: {
    width: '47%', borderWidth: 0.5, borderRadius: borderRadius.lg,
    padding: spacing.md, ...shadows.sm,
  },
  quickCardDot: { width: 32, height: 32, borderRadius: borderRadius.sm, marginBottom: spacing[2] },
  quickCardTitle: { ...typography.bodySmall, fontFamily: 'DMSans-Medium', marginBottom: 2 },
  quickCardSub: { ...typography.label },
  card: {
    marginHorizontal: spacing.lg, borderWidth: 0.5, borderRadius: borderRadius.lg,
    padding: spacing[4], gap: spacing[1], ...shadows.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] },
  tipoBadge: {
    paddingHorizontal: spacing[2], paddingVertical: 2,
    borderRadius: borderRadius.sm, borderWidth: 0.5,
  },
  tipoText: { ...typography.micro, fontFamily: 'DMSans-Medium' },
  cardTitle: { ...typography.cardTitle },
  cardSub: { ...typography.label },
  cardMeta: { ...typography.label },
  emptyCard: {
    marginHorizontal: spacing.lg, borderWidth: 0.5, borderRadius: borderRadius.lg,
    padding: spacing.xl, alignItems: 'center', gap: spacing[2],
  },
  emptyDot: { width: 40, height: 40, borderRadius: 20, marginBottom: spacing[2] },
  emptyTitle: { ...typography.cardTitle },
  emptySub: { ...typography.bodySmall, textAlign: 'center', lineHeight: 20 },
});
