import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, useColors, typography, spacing, borderRadius, shadows } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useCulturaStore } from '@/store/useCulturaStore';
import { useViajesStore } from '@/store/useViajesStore';
import { useLumiStore } from '@/store/useLumiStore';
import { useLumiHistory } from '@/hooks/useLumiHistory';
import { sendLumiMessage, isLumiLimitReached } from '@/services/lumiService';
import { deleteAllMensajes } from '@/services/lumi_mensajes_service';
import { buildLumiContext } from '@/utils/buildLumiContext';
import type { ChatMessage } from '@/types/models';

// ── Componentes locales ────────────────────────────────────

function TypingIndicator() {
  const colors = useColors();
  return (
    <View style={styles.typingRow}>
      <View style={[styles.typingBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.typingText, { color: colors.textHint }]}>Lumi está escribiendo</Text>
        <ActivityIndicator size="small" color={colors.purple} style={{ marginLeft: spacing[2] }} />
      </View>
    </View>
  );
}

function MessageBubble({ item }: { item: ChatMessage }) {
  const colors = useColors();
  const isUser = item.rol === 'user';
  return (
    <View style={[styles.bubbleWrapper, isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperBot]}>
      {!isUser && (
        <View style={[styles.lumiAvatar, { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder }]}>
          <Text style={[styles.lumiAvatarText, { color: colors.purple }]}>✦</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? [styles.bubbleUser, { backgroundColor: colors.purple }] : [styles.bubbleBot, { backgroundColor: colors.surface, borderColor: colors.border }]]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : [styles.bubbleTextBot, { color: colors.textPrimary }]]}>
          {item.contenido}
        </Text>
      </View>
    </View>
  );
}

function EmptyChat() {
  const colors = useColors();
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyAvatar, { backgroundColor: colors.purpleLight, borderColor: colors.purpleBorder }]}>
        <Text style={[styles.emptyAvatarText, { color: colors.purple }]}>✦</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Hola, soy Lumi</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Tu asistente cultural. Puedo recomendarte películas, libros, ayudarte a planear un viaje o conectar tus intereses con destinos nuevos.
      </Text>
    </View>
  );
}

// ── Pantalla principal ─────────────────────────────────────

export default function LumiScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const { session, profile } = useAuthStore();
  const registros = useCulturaStore((s) => s.registros);
  const viajes = useViajesStore((s) => s.viajes);

  const messages = useLumiStore((s) => s.messages);
  const addMessage = useLumiStore((s) => s.addMessage);
  const clearMessages = useLumiStore((s) => s.clearMessages);
  const isTyping = useLumiStore((s) => s.isTyping);
  const setTyping = useLumiStore((s) => s.setTyping);
  const llamadasHoy = useLumiStore((s) => s.llamadasHoy);
  const setLlamadasHoy = useLumiStore((s) => s.setLlamadasHoy);

  const userId = session?.user?.id;
  const { isLoading: isLoadingHistory } = useLumiHistory(userId);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // ── Enviar mensaje ─────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !userId || isSending) return;

    if (isLumiLimitReached(llamadasHoy)) {
      Alert.alert(
        'Lumi descansa',
        'Has alcanzado el límite de 20 conversaciones hoy. Vuelve mañana.',
      );
      return;
    }

    // 1. Agregar mensaje del usuario inmediatamente
    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      rol: 'user',
      contenido: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInputText('');
    setIsSending(true);
    setTyping(true);

    // Scroll al fondo
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // 2. Construir contexto con datos reales del store
      const viajeActivo = viajes.find(
        (v) => v.estado === 'planificado' || v.estado === 'sonado'
      ) ?? null;
      const { systemPrompt, contextSnapshot } = buildLumiContext(
        profile,
        registros,
        viajeActivo,
      );

      // 3. Llamar a la Edge Function
      const { reply, llamadasHoy: nuevasLlamadas } = await sendLumiMessage({
        userMessage: text,
        systemPrompt,
        history: messages,
        contextSnapshot,
        userId,
      });

      // 4. Agregar respuesta de Lumi
      const lumiMsg: ChatMessage = {
        id: `lumi-${Date.now()}`,
        rol: 'assistant',
        contenido: reply,
        timestamp: new Date(),
      };
      addMessage(lumiMsg);
      setLlamadasHoy(nuevasLlamadas);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Lumi no responde', message);
    } finally {
      setTyping(false);
      setIsSending(false);
    }
  }, [
    inputText, userId, isSending, llamadasHoy,
    addMessage, setTyping, setLlamadasHoy,
    messages, profile, registros, viajes,
  ]);

  // ── Limpiar conversación ───────────────────────────────
  const handleClear = useCallback(() => {
    if (!userId) return;
    Alert.alert(
      'Limpiar conversación',
      '¿Borrar todo el historial con Lumi?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllMensajes(userId);
              clearMessages();
            } catch {
              Alert.alert('Error', 'No se pudo borrar la conversación.');
            }
          },
        },
      ],
    );
  }, [userId, clearMessages]);

  const limitReached = isLumiLimitReached(llamadasHoy);

  // ── Render ─────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.cream }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>✦</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Lumi</Text>
            <Text style={styles.headerSubtitle}>
              {limitReached ? 'Límite alcanzado por hoy' : 'Tu asistente cultural'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de mensajes */}
      {isLoadingHistory ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.purple} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.messagesListEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => <MessageBubble item={item} />}
          ListEmptyComponent={<EmptyChat />}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />
      )}

      {/* Input */}
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + spacing[2] }]}>
        <TextInput
          style={[styles.input, limitReached && styles.inputDisabled]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={limitReached ? 'Límite diario alcanzado' : 'Escríbele a Lumi...'}
          placeholderTextColor={colors.textHint}
          multiline
          maxLength={1000}
          editable={!limitReached && !isSending}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isSending || limitReached) && styles.sendBtnDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending || limitReached}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Estilos ────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.purpleLight,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: {
    fontSize: 15,
    color: colors.purple,
  },
  headerTitle: {
    ...typography.bodySmall,
    fontFamily: 'DMSans-Medium',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.micro,
    color: colors.textHint,
    marginTop: 1,
  },
  clearBtn: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.full,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  clearBtnText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperBot: {
    justifyContent: 'flex-start',
  },
  lumiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.purpleLight,
    borderWidth: 0.5,
    borderColor: colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 2,
  },
  lumiAvatarText: {
    fontSize: 11,
    color: colors.purple,
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  bubbleUser: {
    backgroundColor: colors.purple,
    borderBottomRightRadius: borderRadius.sm,
  },
  bubbleBot: {
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderBottomLeftRadius: borderRadius.sm,
  },
  bubbleText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: colors.surface,
  },
  bubbleTextBot: {
    color: colors.textPrimary,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
    paddingLeft: 34,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  typingText: {
    ...typography.label,
    color: colors.textHint,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  emptyAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purpleLight,
    borderWidth: 1,
    borderColor: colors.purpleBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  emptyAvatarText: {
    fontSize: 22,
    color: colors.purple,
  },
  emptyTitle: {
    ...typography.sectionTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    backgroundColor: colors.surface,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.cream,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: colors.purpleBorder,
  },
  sendBtnText: {
    fontSize: 20,
    color: colors.surface,
    fontWeight: '500',
    lineHeight: 24,
  },
});
