import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useLumiStore } from '@/store/useLumiStore';
import { useLumiHistory } from '@/hooks/useLumiHistory';
import { deleteAllMensajes } from '@/services/lumi_mensajes_service';

export default function LumiScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  const messages = useLumiStore((state) => state.messages);
  const clearMessages = useLumiStore((state) => state.clearMessages);
  const userId = session?.user?.id;
  const { isLoading } = useLumiHistory(userId);

  const handleClearConversation = () => {
    if (!userId) return;

    Alert.alert(
      'Limpiar conversación',
      '¿Estás seguro de que quieres borrar todo el historial de Lumi?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllMensajes(userId);
              clearMessages();
            } catch (error) {
              console.error('Error borrando conversación:', error);
              Alert.alert('Error', 'No se pudo borrar la conversación.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.title}>Lumi</Text>
        <Button
          title="Limpiar conversación"
          onPress={handleClearConversation}
          disabled={!userId}
          color={colors.purple}
        />
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.purple} />
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageBubble,
                  item.rol === 'user'
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    item.rol === 'user'
                      ? styles.userText
                      : styles.assistantText,
                  ]}
                >
                  {item.contenido}
                </Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>
                No hay mensajes en el historial.
              </Text>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
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
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  messagesList: {
    flexGrow: 1,
    paddingBottom: spacing[4],
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing[3],
    borderRadius: spacing[3],
    marginVertical: spacing[1],
  },
  userBubble: {
    backgroundColor: colors.purple,
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  messageText: {
    ...typography.body,
  },
  userText: {
    color: colors.surface,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
