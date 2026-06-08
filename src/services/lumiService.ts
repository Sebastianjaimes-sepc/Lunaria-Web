import { supabase } from '@/lib/supabase';
import { LUMI_MAX_DAILY_CALLS } from '@/constants';
import type { ChatMessage } from '@/types/models';

interface SendMessageParams {
  userMessage: string;
  systemPrompt: string;
  history: ChatMessage[];
  contextSnapshot: Record<string, unknown>;
  userId: string;
}

interface LumiResponse {
  reply: string;
  llamadasHoy: number;
}

/**
 * Envía un mensaje a Lumi vía Supabase Edge Function.
 * La API key de Claude NUNCA toca el cliente.
 */
export async function sendLumiMessage({
  userMessage,
  systemPrompt,
  history,
  contextSnapshot,
  userId,
}: SendMessageParams): Promise<LumiResponse> {
  const { data, error } = await supabase.functions.invoke('lumi', {
    body: {
      user_id: userId,
      message: userMessage,
      system_prompt: systemPrompt,
      history: history.slice(-LUMI_MAX_DAILY_CALLS).map((m) => ({
        role: m.rol,
        content: m.contenido,
      })),
      context_snapshot: contextSnapshot,
    },
  });

  if (error) throw error;

  return {
    reply: data.reply as string,
    llamadasHoy: data.llamadas_hoy as number,
  };
}

/**
 * Verifica cuántas llamadas ha hecho el usuario hoy.
 */
export async function getLumiUsageToday(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lumi_uso_diario')
    .select('llamadas')
    .eq('user_id', userId)
    .eq('fecha', today)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return 0; // No row = 0 calls
    throw error;
  }

  return (data?.llamadas as number) ?? 0;
}

export function isLumiLimitReached(llamadasHoy: number): boolean {
  return llamadasHoy >= LUMI_MAX_DAILY_CALLS;
}
